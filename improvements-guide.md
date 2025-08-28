# 코드 개선 가이드

## ✅ 완료된 개선사항

### 1. 유틸리티 모듈 (utils.js)
- ✅ 에러 핸들링 시스템
- ✅ 좌표계 변환 유틸리티  
- ✅ 메모리 관리 시스템
- ✅ 입력 검증 도구
- ✅ 렌더링 품질 관리
- ✅ DOM 안전 조작 (XSS 방지)

### 2. Mode 1 개선사항
- ✅ 좌표계 정규화 (0-1 범위)
- ✅ X/Y축 독립적 스케일링
- ✅ 에러 처리 추가
- ✅ 메모리 정리 함수
- ✅ 이미지 품질 설정 일관성

## 📋 Mode 2-4에 적용해야 할 패턴

### Mode 2 (앞판+뒷판) 개선 필요사항

```javascript
// 1. 상태 관리 개선
const mode2State = {
    // ... 기존 상태 ...
    objectURLs: new Set(), // 메모리 관리 추가
    originalImages: {
        frontDesign: null,
        backDesign: null,
        frontTshirts: [],
        backTshirts: []
    }
};

// 2. 렌더링 함수 개선
function renderFrontBack(canvas, ctx, side) {
    // 품질 설정
    if (window.TDesignUtils) {
        window.TDesignUtils.RenderQuality.setHighQuality(ctx);
    }
    
    try {
        // 렌더링 로직
    } catch (error) {
        console.error(`${side} render error:`, error);
    }
}

// 3. 저장 시 좌표 변환
function saveMode2() {
    // X/Y축 독립 스케일링 적용
    const xScale = window.outputWidth / 600;
    const yScale = window.outputHeight / 720;
    
    // 정규화된 좌표 사용
    const coords = window.TDesignUtils.CoordinateSystem.previewToSave(x, y);
}

// 4. 클린업 함수
function cleanupMode2() {
    if (window.TDesignUtils) {
        window.TDesignUtils.MemoryManager.cleanup();
    }
    mode2State.objectURLs.forEach(url => URL.revokeObjectURL(url));
}
```

### Mode 3 (디자인 합성) 개선 필요사항

```javascript
// 1. 배경 제거 시 에러 처리
function removeBackground(imageData) {
    try {
        // 배경 제거 로직
        return processedImageData;
    } catch (error) {
        console.error('Background removal failed:', error);
        return imageData; // 원본 반환
    }
}

// 2. 확대 영역 정규화
const mode3State = {
    // ... 기존 상태 ...
    normalizedZoomArea: null, // 정규화된 좌표 저장
    detailAreaNormalized: { x: 0.5, y: 0.5 } // 0-1 범위
};

// 3. 드래그 앤 드롭 개선
function handleDrag(e) {
    if (window.TDesignUtils) {
        const coords = window.TDesignUtils.Validator.validateCoordinate(
            e.clientX, e.clientY, canvas.width, canvas.height
        );
        // 사용
    }
}
```

### Mode 4 (컬러칩) 개선 필요사항

```javascript
// 1. 이미지 검증
function addColorChipImage(file) {
    try {
        if (window.TDesignUtils) {
            window.TDesignUtils.Validator.validateImageFile(file);
        }
        // 처리
    } catch (error) {
        alert(error.message);
        return;
    }
}

// 2. 안전한 DOM 조작
function updateColorNames() {
    mode4State.texts.forEach((text, index) => {
        if (window.TDesignUtils) {
            window.TDesignUtils.SafeDOM.setText(
                `color-name-${index}`, 
                text
            );
        }
    });
}

// 3. 메모리 효율적 렌더링
function renderColorChip() {
    // requestAnimationFrame 사용
    requestAnimationFrame(() => {
        // 렌더링 로직
    });
}
```

## 🔧 공통 개선 패턴

### 1. 모든 파일 입력에 검증 추가
```javascript
element.addEventListener('change', (e) => {
    const file = e.target.files[0];
    
    try {
        // 검증
        if (window.TDesignUtils) {
            window.TDesignUtils.Validator.validateImageFile(file);
        }
        
        // 처리
        const reader = new FileReader();
        reader.onerror = () => alert('파일 읽기 실패');
        // ...
    } catch (error) {
        alert(error.message);
    }
});
```

### 2. 모든 렌더링에 품질 설정
```javascript
function render(ctx) {
    // 항상 품질 설정
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // 또는 유틸리티 사용
    if (window.TDesignUtils) {
        window.TDesignUtils.RenderQuality.setHighQuality(ctx);
    }
}
```

### 3. 좌표 변환 일관성
```javascript
// 미리보기 → 저장 변환
const saveCoords = window.TDesignUtils.CoordinateSystem.previewToSave(
    previewX, previewY
);

// 정규화 사용
const normalized = window.TDesignUtils.CoordinateSystem.normalizeCoordinate(
    x, y, canvas.width, canvas.height
);
```

### 4. innerHTML 대체
```javascript
// 위험
element.innerHTML = `<span>${userInput}</span>`;

// 안전
element.textContent = userInput;
// 또는
window.TDesignUtils.SafeDOM.setText(element, userInput);
```

## 📊 성능 최적화

### 1. 디바운싱/쓰로틀링
```javascript
// 슬라이더 이벤트
const debouncedRender = window.TDesignUtils.debounce(render, 16);
slider.addEventListener('input', debouncedRender);

// 마우스 이동
const throttledDrag = window.TDesignUtils.throttle(handleDrag, 16);
canvas.addEventListener('mousemove', throttledDrag);
```

### 2. requestAnimationFrame 사용
```javascript
function render() {
    requestAnimationFrame(() => {
        // Canvas 렌더링
    });
}
```

## 🚨 중요 주의사항

1. **좌표계**: 항상 X/Y축 독립적으로 처리
2. **메모리**: 이벤트 리스너와 URL 객체 반드시 정리
3. **에러**: try-catch로 모든 위험 작업 감싸기
4. **XSS**: innerHTML 사용 최소화, textContent 우선
5. **품질**: 모든 Canvas 렌더링에 품질 설정 적용

## 테스트 체크리스트

- [ ] 다양한 이미지 크기 테스트
- [ ] 잘못된 파일 형식 업로드
- [ ] 대용량 파일 처리
- [ ] 브라우저 메모리 사용량 확인
- [ ] 콘솔 에러 확인
- [ ] 저장 결과물 품질 확인