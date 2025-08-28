// 유틸리티 및 에러 핸들링 모듈
(function() {
    'use strict';

    // 에러 핸들링 유틸리티
    const ErrorHandler = {
        // 이미지 로드 에러 처리
        handleImageLoad: function(img, onSuccess, onError) {
            img.onload = function() {
                try {
                    onSuccess(img);
                } catch (error) {
                    console.error('Image processing error:', error);
                    onError && onError('이미지 처리 중 오류가 발생했습니다.');
                }
            };
            
            img.onerror = function() {
                console.error('Image load failed:', img.src);
                onError && onError('이미지를 불러올 수 없습니다.');
            };
        },

        // 비동기 작업 래핑
        wrapAsync: async function(fn, fallback) {
            try {
                return await fn();
            } catch (error) {
                console.error('Async operation failed:', error);
                if (fallback) return fallback;
                throw error;
            }
        },

        // 안전한 렌더링
        safeRender: function(renderFn, canvas, ctx) {
            try {
                // 렌더링 품질 설정
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                renderFn(canvas, ctx);
            } catch (error) {
                console.error('Render error:', error);
                // 캔버스 초기화
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 에러 메시지 표시
                ctx.fillStyle = '#ef4444';
                ctx.font = '16px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('렌더링 오류 발생', canvas.width / 2, canvas.height / 2);
            }
        }
    };

    // 좌표계 변환 유틸리티
    const CoordinateSystem = {
        // 미리보기 캔버스 크기
        PREVIEW_WIDTH: 600,
        PREVIEW_HEIGHT: 720,
        
        // 저장 캔버스 크기 (동적)
        getSaveSize: function() {
            return {
                width: window.outputWidth || 1500,
                height: window.outputHeight || 1500
            };
        },

        // 좌표를 정규화 (0-1 범위)
        normalizeCoordinate: function(x, y, canvasWidth, canvasHeight) {
            return {
                x: x / canvasWidth,
                y: y / canvasHeight
            };
        },

        // 정규화된 좌표를 캔버스 좌표로 변환
        denormalizeCoordinate: function(normalX, normalY, canvasWidth, canvasHeight) {
            return {
                x: normalX * canvasWidth,
                y: normalY * canvasHeight
            };
        },

        // 미리보기 좌표를 저장 좌표로 변환
        previewToSave: function(previewX, previewY) {
            const saveSize = this.getSaveSize();
            const xScale = saveSize.width / this.PREVIEW_WIDTH;
            const yScale = saveSize.height / this.PREVIEW_HEIGHT;
            
            return {
                x: previewX * xScale,
                y: previewY * yScale,
                xScale: xScale,
                yScale: yScale
            };
        },

        // 스케일 독립적 변환
        transformWithAspectRatio: function(value, isX) {
            const saveSize = this.getSaveSize();
            if (isX) {
                return value * (saveSize.width / this.PREVIEW_WIDTH);
            } else {
                return value * (saveSize.height / this.PREVIEW_HEIGHT);
            }
        }
    };

    // 메모리 관리 유틸리티
    const MemoryManager = {
        objectURLs: new Set(),
        eventListeners: new Map(),

        // URL 생성 및 추적
        createObjectURL: function(blob) {
            const url = URL.createObjectURL(blob);
            this.objectURLs.add(url);
            return url;
        },

        // URL 해제
        revokeObjectURL: function(url) {
            if (this.objectURLs.has(url)) {
                URL.revokeObjectURL(url);
                this.objectURLs.delete(url);
            }
        },

        // 모든 URL 정리
        cleanupURLs: function() {
            this.objectURLs.forEach(url => URL.revokeObjectURL(url));
            this.objectURLs.clear();
        },

        // 이벤트 리스너 추적
        addEventListener: function(element, event, handler, options) {
            if (!this.eventListeners.has(element)) {
                this.eventListeners.set(element, []);
            }
            
            this.eventListeners.get(element).push({ event, handler, options });
            element.addEventListener(event, handler, options);
        },

        // 이벤트 리스너 정리
        removeEventListeners: function(element) {
            const listeners = this.eventListeners.get(element);
            if (listeners) {
                listeners.forEach(({ event, handler, options }) => {
                    element.removeEventListener(event, handler, options);
                });
                this.eventListeners.delete(element);
            }
        },

        // 전체 정리
        cleanup: function() {
            this.cleanupURLs();
            this.eventListeners.forEach((listeners, element) => {
                listeners.forEach(({ event, handler, options }) => {
                    element.removeEventListener(event, handler, options);
                });
            });
            this.eventListeners.clear();
        }
    };

    // 입력 검증 유틸리티
    const Validator = {
        // 파일 검증
        validateImageFile: function(file) {
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            const maxSize = 10 * 1024 * 1024; // 10MB

            if (!file) {
                throw new Error('파일이 선택되지 않았습니다.');
            }

            if (!validTypes.includes(file.type)) {
                throw new Error(`지원하지 않는 파일 형식입니다. (지원: ${validTypes.join(', ')})`);
            }

            if (file.size > maxSize) {
                throw new Error(`파일 크기는 10MB를 초과할 수 없습니다. (현재: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
            }

            return true;
        },

        // 좌표 범위 검증
        validateCoordinate: function(x, y, maxX, maxY) {
            return {
                x: Math.max(0, Math.min(x, maxX)),
                y: Math.max(0, Math.min(y, maxY))
            };
        },

        // 스케일 검증
        validateScale: function(scale) {
            return Math.max(0.05, Math.min(2, scale));
        }
    };

    // 렌더링 품질 유틸리티
    const RenderQuality = {
        // 고품질 렌더링 설정
        setHighQuality: function(ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.filter = 'none';
            return ctx;
        },

        // 안티앨리어싱 설정
        enableAntialiasing: function(ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            return ctx;
        },

        // 저품질 (빠른) 렌더링 설정
        setLowQuality: function(ctx) {
            ctx.imageSmoothingEnabled = false;
            return ctx;
        }
    };

    // 디바운스 유틸리티
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 쓰로틀 유틸리티
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // DOM 안전 유틸리티
    const SafeDOM = {
        // 안전한 텍스트 설정
        setText: function(element, text) {
            if (typeof element === 'string') {
                element = document.getElementById(element);
            }
            if (element) {
                element.textContent = text;
            }
            return element;
        },

        // 안전한 HTML 설정 (필요한 경우만)
        setHTML: function(element, html) {
            if (typeof element === 'string') {
                element = document.getElementById(element);
            }
            if (element) {
                // 기본적인 XSS 방지
                const temp = document.createElement('div');
                temp.textContent = html;
                const sanitized = temp.innerHTML;
                element.innerHTML = sanitized;
            }
            return element;
        },

        // 클래스 추가/제거
        addClass: function(element, className) {
            if (typeof element === 'string') {
                element = document.getElementById(element);
            }
            if (element) {
                element.classList.add(className);
            }
            return element;
        },

        removeClass: function(element, className) {
            if (typeof element === 'string') {
                element = document.getElementById(element);
            }
            if (element) {
                element.classList.remove(className);
            }
            return element;
        }
    };

    // 전역 노출
    window.TDesignUtils = {
        ErrorHandler,
        CoordinateSystem,
        MemoryManager,
        Validator,
        RenderQuality,
        SafeDOM,
        debounce,
        throttle
    };

})();