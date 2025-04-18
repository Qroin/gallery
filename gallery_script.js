document.addEventListener('DOMContentLoaded', () => {
    const galleryItemsContainer = document.getElementById('gallery-items');
    const galleryTitle = document.getElementById('gallery-title');
    const galleryDescription = document.getElementById('gallery-description');
    const loadingIndicator = galleryItemsContainer.querySelector('.loading-indicator');

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxVideo = document.getElementById('lightbox-video');
    const lightboxVideoSource = lightboxVideo.querySelector('source');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeButton = lightbox.querySelector('.lightbox-close');
    const prevButton = lightbox.querySelector('.lightbox-nav.prev');
    const nextButton = lightbox.querySelector('.lightbox-nav.next');

    let currentGalleryItems = [];
    let currentIndex = -1;

    // URL에서 갤러리 폴더 이름 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const galleryFolder = urlParams.get('folder');

    if (!galleryFolder) {
        galleryTitle.textContent = '잘못된 접근';
        galleryDescription.textContent = '갤러리 정보를 찾을 수 없습니다.';
        loadingIndicator.style.display = 'none';
        return;
    }

    fetch('contents.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(galleries => {
            const currentGallery = galleries.find(g => g.folder === galleryFolder);

            if (!currentGallery) {
                throw new Error(`갤러리 "${galleryFolder}"를 찾을 수 없습니다.`);
            }

            galleryTitle.textContent = currentGallery.title;
            galleryDescription.textContent = currentGallery.description;
            currentGalleryItems = currentGallery.items; // 현재 갤러리 아이템 저장

            loadingIndicator.style.display = 'none'; // 로딩 숨기기

            if (currentGalleryItems.length === 0) {
                 galleryItemsContainer.innerHTML = '<p>이 갤러리에는 아직 콘텐츠가 없습니다.</p>';
                 return;
            }

            currentGalleryItems.forEach((item, index) => {
                const itemElement = document.createElement('div');
                itemElement.className = 'gallery-item';
                itemElement.dataset.index = index; // 인덱스 저장

                const itemPath = `${galleryFolder}/${item.src}`;

                if (item.type === 'image') {
                    const img = document.createElement('img');
                    img.src = itemPath;
                    img.alt = `${currentGallery.title} 이미지 ${index + 1}`;
                    img.loading = 'lazy'; // 이미지 지연 로딩
                    itemElement.appendChild(img);
                } else if (item.type === 'video') {
                    const video = document.createElement('video');
                    video.src = itemPath;
                    video.muted = true; // 자동재생을 위해 음소거 (선택적)
                    // video.autoplay = true; // 미리보기 자동재생 (성능 영향 고려)
                    // video.loop = true;
                    if (item.poster) { // 포스터 이미지 설정
                        video.poster = `${galleryFolder}/${item.poster}`;
                    } else {
                        // 포스터 없으면 기본 썸네일 표시용 (첫 프레임 로딩 기다릴 수 있음)
                         video.preload = 'metadata';
                    }
                    itemElement.appendChild(video);

                    // 비디오 아이콘 추가
                    const videoIcon = document.createElement('span');
                    videoIcon.className = 'video-icon';
                    videoIcon.innerHTML = '&#9658;'; // 재생 아이콘 (유니코드)
                    itemElement.appendChild(videoIcon);
                }

                itemElement.addEventListener('click', () => {
                    currentIndex = index;
                    showLightbox();
                });

                galleryItemsContainer.appendChild(itemElement);
            });
        })
        .catch(error => {
            console.error('갤러리 콘텐츠 로딩 오류:', error);
            galleryTitle.textContent = '오류 발생';
            galleryDescription.textContent = '콘텐츠를 불러오는 데 실패했습니다.';
            loadingIndicator.textContent = '콘텐츠 로딩 실패.';
            loadingIndicator.style.color = 'red';
        });

    // 라이트박스 표시 함수
    function showLightbox() {
        if (currentIndex < 0 || currentIndex >= currentGalleryItems.length) return;

        const item = currentGalleryItems[currentIndex];
        const itemPath = `${galleryFolder}/${item.src}`;

        lightboxImg.style.display = 'none';
        lightboxVideo.style.display = 'none';
        lightboxVideo.pause(); // 비디오 전환 시 정지

        if (item.type === 'image') {
            lightboxImg.src = itemPath;
            lightboxImg.style.display = 'block';
            lightboxCaption.textContent = `이미지 ${currentIndex + 1} / ${currentGalleryItems.length}`;
        } else if (item.type === 'video') {
            lightboxVideoSource.src = itemPath;
            lightboxVideo.load(); // 새 소스 로드
            lightboxVideo.style.display = 'block';
            // lightboxVideo.play(); // 자동으로 재생하려면 주석 해제
             lightboxCaption.textContent = `비디오 ${currentIndex + 1} / ${currentGalleryItems.length}`;
        }

        lightbox.classList.add('show'); // CSS 애니메이션 적용

        // 네비게이션 버튼 활성화/비활성화
        prevButton.style.display = currentIndex > 0 ? 'block' : 'none';
        nextButton.style.display = currentIndex < currentGalleryItems.length - 1 ? 'block' : 'none';

        // 키보드 네비게이션 추가
        document.addEventListener('keydown', handleKeyboardNav);
    }

    // 라이트박스 숨기기 함수
    function hideLightbox() {
        lightbox.classList.remove('show');
        lightboxVideo.pause(); // 숨길 때 비디오 정지
        lightboxVideoSource.src = ""; // 비디오 소스 제거 (메모리 관리)
        lightboxImg.src = "";       // 이미지 소스 제거
        currentIndex = -1;
        // 키보드 네비게이션 제거
        document.removeEventListener('keydown', handleKeyboardNav);
    }

    // 네비게이션 버튼 이벤트
    prevButton.addEventListener('click', (e) => {
        e.stopPropagation(); // 이벤트 버블링 방지
        if (currentIndex > 0) {
            currentIndex--;
            showLightbox();
        }
    });

    nextButton.addEventListener('click', (e) => {
         e.stopPropagation();
        if (currentIndex < currentGalleryItems.length - 1) {
            currentIndex++;
            showLightbox();
        }
    });

    // 닫기 버튼 및 배경 클릭 이벤트
    closeButton.addEventListener('click', hideLightbox);
    lightbox.addEventListener('click', (e) => {
        // 콘텐츠 영역 외부를 클릭했을 때만 닫기
        if (e.target === lightbox) {
            hideLightbox();
        }
    });

    // 키보드 네비게이션 핸들러
    function handleKeyboardNav(e) {
        if (e.key === 'Escape') {
            hideLightbox();
        } else if (e.key === 'ArrowLeft') {
            if (currentIndex > 0) {
                currentIndex--;
                showLightbox();
            }
        } else if (e.key === 'ArrowRight') {
             if (currentIndex < currentGalleryItems.length - 1) {
                currentIndex++;
                showLightbox();
            }
        }
    }
});