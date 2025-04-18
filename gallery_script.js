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
            
            // 아이템이 1개일 경우 전용 클래스 추가
            if (currentGalleryItems.length === 1) {
                galleryItemsContainer.classList.add('single-item');
            } else {
                galleryItemsContainer.classList.remove('single-item');
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
                    img.loading = 'lazy';
                    img.classList.add('zoomable'); // CSS로 시각적 힌트 추가
                    img.style.cursor = 'zoom-in';
                
                    // 클릭 및 터치 이벤트
                    img.addEventListener('click', e => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Image clicked'); // 디버깅용
                        openImageModal(itemPath);
                    });
                    img.addEventListener('touchstart', e => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Image touched'); // 디버깅용
                        openImageModal(itemPath);
                    });
                
                    itemElement.appendChild(img);
                }
                else if (item.type === 'video') {
                    const video = document.createElement('video');
                    video.controls = true;
                    video.src = itemPath;
                    // video.muted = true; // 자동재생을 위해 음소거 (선택적)
                    video.volume = 0.05;
                    video.autoplay = true; // 미리보기 자동재생 (성능 영향 고려)
                    video.loop = true;
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
                    // itemElement.appendChild(videoIcon);
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

        // 이미지/비디오 표시 초기화
        lightboxImg.style.display = 'none';
        lightboxVideo.style.display = 'none';
        lightboxVideo.pause(); // 이전 비디오 정지 (중요)
        // lightboxVideoSource.src = ""; // 소스 변경 전에 비워두면 깜빡일 수 있으므로, load() 전에 설정

        if (item.type === 'image') {
            lightboxImg.src = itemPath;
            lightboxImg.style.display = 'block';
            lightboxCaption.textContent = `이미지 ${currentIndex + 1} / ${currentGalleryItems.length}`;
        } else if (item.type === 'video') {
            lightboxVideoSource.src = itemPath; // 새 비디오 소스 설정
            lightboxVideo.load(); // 비디오 로드 (play() 전에 필요)
            lightboxVideo.style.display = 'block';
            lightboxCaption.textContent = `비디오 ${currentIndex + 1} / ${currentGalleryItems.length}`;

            // --- 자동 재생 코드 추가 ---
            lightboxVideo.muted = true; // 자동 재생 정책 준수를 위해 음소거
            const playPromise = lightboxVideo.play(); // 비디오 재생 시도
 
            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    // 자동 재생 성공 (특별히 할 일 없음)
                    console.log("비디오 자동 재생 시작됨 (음소거 상태)");
                }).catch(error => {
                    // 자동 재생 실패 (예: 브라우저 정책)
                    // controls가 있으므로 사용자가 직접 재생할 수 있음
                    console.error("비디오 자동 재생 실패:", error);
                    // 이 경우 사용자가 controls의 재생 버튼을 눌러야 함
                });
            }
            // --- 자동 재생 코드 끝 ---

        }

        lightbox.classList.add('show'); // 라이트박스 보이기

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
