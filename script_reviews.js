/* ── script_reviews.js ─────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
    const reviewsGrid = document.getElementById('reviews-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const loader = document.getElementById('loader');
    
    // Lightbox Elements
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    const lbText = document.getElementById('lightbox-text');
    const lbAuthor = document.getElementById('lightbox-author');
    const lbDate = document.getElementById('lightbox-date');
    const lbTag = document.getElementById('lightbox-tag');
    const lbClose = document.getElementById('lightbox-close');

    let allReviews = [];

    // 1. CSV 데이터 로드 (PapaParse 이용)
    Papa.parse('data/reviews.csv', {
        download: true,
        header: true,
        complete: function(results) {
            // 빈 데이터 제거 및 유효 데이터 필터링
            allReviews = results.data.filter(row => row.id && row.image && row.category);
            
            // 최근 날짜순 정렬 (2026.05.20 -> 2026.05.01)
            allReviews.sort((a, b) => b.date.localeCompare(a.date));
            
            renderReviews('전체');
            initFilterSystem();
            hideLoader();
        },
        error: function(err) {
            console.error("Error loading reviews.csv:", err);
            reviewsGrid.innerHTML = `<div class="error-msg">방문후기 데이터를 로드하는 중 오류가 발생했습니다.<br>로컬 또는 서버 환경에서 다시 확인해주세요.</div>`;
            hideLoader();
        }
    });

    // 2. 리뷰 카드 렌더링 로직 (페이드인 애니메이션 결합)
    function renderReviews(filterTag) {
        reviewsGrid.innerHTML = '';
        
        const filtered = filterTag === '전체' 
            ? allReviews 
            : allReviews.filter(r => r.category === filterTag);

        if (filtered.length === 0) {
            reviewsGrid.innerHTML = `<div class="no-data-msg">'#${filterTag}' 테마에 해당하는 리뷰가 없습니다.</div>`;
            return;
        }

        filtered.forEach((review, index) => {
            const card = document.createElement('div');
            card.className = 'review-card fade-in';
            card.dataset.category = review.category;
            
            // stars 필드에 따른 별 표시 생성
            const starCount = parseInt(review.stars) || 5;
            const starText = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);

            card.innerHTML = `
                <div class="card-img-container">
                    <img src="${review.image}" alt="${review.comment.substring(0, 30)}..." class="card-img" loading="lazy">
                    <div class="card-category"># ${review.category}</div>
                </div>
                <div class="card-body">
                    <div class="card-stars">${starText}</div>
                    <p class="card-text">${review.comment}</p>
                    <div class="card-footer">
                        <span class="card-author">${review.id}</span>
                        <span class="card-date">${review.date}</span>
                    </div>
                </div>
            `;

            // 클릭 이벤트 -> 라이트박스 오픈
            card.addEventListener('click', () => {
                openLightbox(review);
            });

            reviewsGrid.appendChild(card);
        });

        // 스크롤 시 순차적으로 떠오르는 뷰포트 애니메이션 바인딩
        observeFadeInCards();
    }

    // 3. 필터 버튼 이벤트 바인딩
    function initFilterSystem() {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // 기존 활성화 해제
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const selectedFilter = btn.dataset.filter;
                
                // 그리드 살짝 투명해지며 자연스럽게 필터링되는 트랜지션 적용
                reviewsGrid.style.opacity = 0;
                reviewsGrid.style.transform = 'translateY(15px)';
                
                setTimeout(() => {
                    renderReviews(selectedFilter);
                    reviewsGrid.style.opacity = 1;
                    reviewsGrid.style.transform = 'translateY(0)';
                }, 300);
            });
        });
    }

    // 4. 스크롤 뷰포트 감시자 (IntersectionObserver)
    function observeFadeInCards() {
        const cards = document.querySelectorAll('.review-card.fade-in');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, idx) => {
                if (entry.isIntersecting) {
                    // 카드들이 한꺼번에 뜨지 않고 0.05초 간격으로 순차적(Staggered) 페이드인되도록 시각 보정
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, idx * 40);
                    
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px' // 하단에서 살짝 올라왔을 때 미리 로드되게 세팅
        });

        cards.forEach(card => observer.observe(card));
    }

    // 5. 시네마틱 라이트박스 제어
    function openLightbox(review) {
        lbImg.src = review.image;
        lbImg.alt = review.comment;
        lbText.textContent = review.comment;
        lbAuthor.textContent = review.id;
        lbDate.textContent = review.date;
        lbTag.textContent = `# ${review.category}`;
        
        const starCount = parseInt(review.stars) || 5;
        const starText = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
        document.querySelector('.lightbox-stars').textContent = starText;

        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden'; // 뒷배경 스크롤 락
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }

    // 라이트박스 닫기 핸들러 모음
    lbClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-wrapper')) {
            closeLightbox();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });

    // 6. 로딩 숨김 처리
    function hideLoader() {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 500);
    }
});
