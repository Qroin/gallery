document.addEventListener('DOMContentLoaded', () => {
  const galleryList = document.getElementById('gallery-list');
  const loadingIndicator = galleryList.querySelector('.loading-indicator');

  fetch('contents.json')
      .then(response => {
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
      })
      .then(galleries => {
          loadingIndicator.style.display = 'none'; // 로딩 숨기기

          galleries.forEach(gallery => {
              const card = document.createElement('a');
              card.href = `gallery.html?folder=${encodeURIComponent(gallery.folder)}`;
              card.className = 'gallery-card';

              const headerImage = document.createElement('img');
              headerImage.src = `${gallery.folder}/header.jpg`;
              headerImage.alt = `${gallery.title} 대표 이미지`;
              // 이미지 로딩 실패 시 대체 처리 (선택적)
              headerImage.onerror = () => {
                  headerImage.alt = '이미지를 불러올 수 없습니다.';
                  // headerImage.src = 'path/to/default-image.jpg'; // 기본 이미지 경로
              };

              const contentDiv = document.createElement('div');
              contentDiv.className = 'gallery-card-content';

              const title = document.createElement('h3');
              title.textContent = gallery.title;

              const description = document.createElement('p');
              description.textContent = gallery.description;

              contentDiv.appendChild(title);
              contentDiv.appendChild(description);
              card.appendChild(headerImage);
              card.appendChild(contentDiv);

              galleryList.appendChild(card);
          });
      })
      .catch(error => {
          console.error('갤러리 데이터를 불러오는 중 오류 발생:', error);
          loadingIndicator.textContent = '갤러리 목록을 불러오는데 실패했습니다.';
          loadingIndicator.style.color = 'red';
      });
});