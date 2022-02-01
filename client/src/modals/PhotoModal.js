import React, {useContext, useEffect, useMemo, useRef, useState} from "react";
import {Context} from "../context";
import {Modal} from "react-bootstrap";
import axiosApi from "../http/axios";

export default function PhotoModal() {
    const {photoModalActive, setPhotoModalActive} = useContext(Context);

    const [photoValidationMessage, setPhotoValidationMessage] = useState('');
    const [isCutterActive, setIsCutterActive] = useState(false);

    //window dragging =====================================================
    const [isDragging, setIsDragging] = useState(false);

    const [startWindowPoint, setStartWindowPoint] = useState({
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
    });
    const [lastLeft, setLastLeft] = useState(null);
    const [lastTop, setLastTop] = useState(null);
    const [transformWindowCoords, setTransformWindowCoords] = useState({
        x: 0,
        y: 0
    });
    const [transformWindowImageCoords, setTransformWindowImageCoords] = useState({
        x: 0,
        y: 0
    });
    const [cutterWindowWrapperSize, setCutterWindowWrapperSize] = useState({
        width: undefined,
        height: undefined
    });

    const [loadedImageDataURL, setLoadedImageDataURL] = useState(undefined);
    const [cutterImageSize, setCutterImageSize] = useState({
        width: undefined,
        height: undefined
    });

    const backgroundImage = useRef(null);
    const cutterWindow = useRef(null);


    //expander dragging =====================================================
    const [isExpanderDragging, setIsExpanderDragging] = useState(false);

    const minCutterWindowSize = useMemo(() => {
        return {
            width: 200,
            height: 200
        }
    }, []);
    const [lastCoords, setLastCoords] = useState({
        x: undefined,
        y: undefined,
    });
    const [crossedBorders, setCrossedBorders] = useState({
        min: false,
        max: false
    });
    const [direction, setDirection] = useState('');

    const loadedImage = useRef(null);



    useEffect(() => {
        setPhotoValidationMessage('');
        setIsCutterActive(false);
    }, []);


    //* selected file validation ===========================================================
    const validImageTypes = [
        'image/jpg',
        'image/jpeg',
        'image/pjpeg',
        'image/png'
    ];

    function validFileType(file, types) {
        for (let i = 0; i < types.length; i++) {
            if (file.type === types[i]) {
                return true;
            }
        }
        return false;
    }

    function photoInputChange(e) {
        if (!e.target.files.length || !validFileType(e.target.files[0], validImageTypes)) {
            setPhotoValidationMessage('Выберите изображение, пожалуйста!');
            setIsCutterActive(false);
        } else {
            let reader = new FileReader();

            reader.onload = function () {
                loadedImage.current = new Image();
                loadedImage.current.onload = function () {
                    console.log(`Изображение загружено, размеры ${loadedImage.current.width}x${loadedImage.current.height}`);

                    let imageWidth = loadedImage.current.width,
                        imageHeight = loadedImage.current.height;

                    if (imageWidth < 400 || imageHeight < 400) {
                        setPhotoValidationMessage('Ширина и высота изображения должны быть минимум 400 пикселей!');
                        setIsCutterActive(false);
                        return;
                    }

                    if (imageWidth > 600 || imageHeight > 600) {
                        let coefficient = loadedImage.current.width / loadedImage.current.height;

                        imageWidth = coefficient >= 1 ? 600 : Math.round(600 * coefficient);
                        imageHeight = coefficient <= 1 ? 600 : Math.round(600 / coefficient);
                    }

                    setPhotoValidationMessage('');
                    setIsCutterActive(true);

                    setLoadedImageDataURL(reader.result);

                    setTransformWindowCoords({
                        x: 0,
                        y: 0
                    });
                    setTransformWindowImageCoords({
                        x: 0,
                        y: 0
                    });

                    setCutterImageSize({
                        width: imageWidth,
                        height: imageHeight
                    });
                    setCutterWindowWrapperSize({
                        width: minCutterWindowSize.width,
                        height: minCutterWindowSize.height
                    });
                }
                loadedImage.current.src = reader.result;
            };

            reader.onerror = function () {
                console.log(reader.error);
            };

            reader.readAsDataURL(e.target.files[0]);
        }
    }
    //* selected file validation ===========================================================


    //* cutter window expanders dragging ===========================================================
    function cutterExpanderMouseDown(e) {
        e.cutterExpanderMouseDown = true;

        cutterWindow.current.style.cursor = e.target.dataset.cursor;
        document.getElementsByTagName('body')[0].style.cursor = e.target.dataset.cursor;

        setIsExpanderDragging(true);
        setLastCoords({
            x: e.clientX,
            y: e.clientY
        });
        setCrossedBorders({
            min: false,
            max: false
        });
        setDirection(e.target.dataset.direction);
    }

    useEffect(() => {
        const mouseMoveHandler = function (e) {
            let cutterWindowWrapper = document.getElementsByClassName('cutter-window__wrapper')[0],
                cutterHolder = cutterWindowWrapper.parentElement.parentElement,
                cutterWindowWrapperRect = cutterWindowWrapper.getBoundingClientRect(),
                cutterHolderRect = cutterHolder.getBoundingClientRect();


            // console.log(`
            //     e.clientX: ${e.clientX}, e.movementX: ${e.movementX}, e.clientY: ${e.clientY}, e.movementY: ${e.movementY},
            //     lastCoords.x: ${lastCoords.x}, lastCoords.y: ${lastCoords.y},
            // `);

            // eslint-disable-next-line default-case
            switch (direction) {
                case 'top-right':
                    if (
                        cutterWindowWrapperRect.right + (e.clientX - lastCoords.x) > cutterHolderRect.right ||
                        cutterWindowWrapperRect.top - (e.clientX - lastCoords.x) < cutterHolderRect.top
                    ) {
                        if (crossedBorders.max) return;
                        console.log('crossed max');

                        let newRibLength = Math.min(cutterHolderRect.right - cutterWindowWrapperRect.left, cutterWindowWrapperRect.bottom - cutterHolderRect.top);
                        cutterWindowWrapper.style.width = cutterWindowWrapper.style.height = newRibLength + 'px';


                        let transformWindowX = transformWindowCoords.x,
                            transformWindowY = cutterHolderRect.height - (cutterHolderRect.bottom - cutterWindowWrapperRect.bottom + newRibLength);


                        setTransformWindowCoords({
                            x: transformWindowX,
                            y: transformWindowY
                        });
                        setTransformWindowImageCoords({
                            x: -transformWindowX,
                            y: -transformWindowY
                        });

                        setLastCoords({
                            x: Math.floor(cutterWindowWrapperRect.left) + newRibLength,
                            y: e.clientY
                        });
                        setCrossedBorders({
                            min: false,
                            max: true
                        });
                    } else if (e.clientX >= cutterWindowWrapperRect.left + minCutterWindowSize.width) {
                        let newRibLength = e.clientX - Math.floor(cutterWindowWrapperRect.left);
                        cutterWindowWrapper.style.width = cutterWindowWrapper.style.height = newRibLength + 'px';

                        let transformWindowX = transformWindowCoords.x,
                            transformWindowY = cutterHolderRect.height - (cutterHolderRect.bottom - cutterWindowWrapperRect.bottom + newRibLength);

                        setTransformWindowCoords({
                            x: transformWindowX,
                            y: transformWindowY
                        });
                        setTransformWindowImageCoords({
                            x: -transformWindowX,
                            y: -transformWindowY
                        });

                        setLastCoords({
                            x: e.clientX,
                            y: e.clientY
                        });
                        setCrossedBorders({
                            min: false,
                            max: false
                        });
                    } else {
                        if (crossedBorders.min) return;
                        console.log('crossed min');

                        cutterWindowWrapper.style.width = cutterWindowWrapper.style.height = minCutterWindowSize.width + 'px';


                        let transformWindowX = transformWindowCoords.x,
                            transformWindowY = cutterHolderRect.height - (cutterHolderRect.bottom - cutterWindowWrapperRect.bottom + minCutterWindowSize.height);


                        setTransformWindowCoords({
                            x: transformWindowX,
                            y: transformWindowY
                        });
                        setTransformWindowImageCoords({
                            x: -transformWindowX,
                            y: -transformWindowY
                        });

                        setLastCoords({
                            x: Math.floor(cutterWindowWrapperRect.left) + cutterWindowWrapperRect.width,
                            y: lastCoords.y
                        });
                        setCrossedBorders({
                            min: true,
                            max: false
                        });
                    }
                    break;

                case 'right-bottom':
                    if (
                        cutterWindowWrapperRect.right + (e.clientX - lastCoords.x) > cutterHolderRect.right ||
                        cutterWindowWrapperRect.bottom + (e.clientX - lastCoords.x) > cutterHolderRect.bottom
                    ) {
                        if (crossedBorders.max) return;
                        console.log('crossed max');

                        let newRibLength = Math.min(cutterHolderRect.right - cutterWindowWrapperRect.left, cutterHolderRect.bottom - cutterWindowWrapperRect.top);
                        cutterWindowWrapper.style.width = cutterWindowWrapper.style.height = newRibLength + 'px';

                        let transformWindowX = transformWindowCoords.x,
                            transformWindowY = transformWindowCoords.y;

                        setTransformWindowCoords({
                            x: transformWindowX,
                            y: transformWindowY
                        });
                        setTransformWindowImageCoords({
                            x: -transformWindowX,
                            y: -transformWindowY
                        });

                        setLastCoords({
                            x: Math.floor(cutterWindowWrapperRect.left) + newRibLength,
                            y: e.clientY
                        });
                        setCrossedBorders({
                            min: false,
                            max: true
                        });
                    } else if (e.clientX >= cutterWindowWrapperRect.left + minCutterWindowSize.width) {
                        let newRibLength = e.clientX - Math.floor(cutterWindowWrapperRect.left);
                        cutterWindowWrapper.style.width = cutterWindowWrapper.style.height = newRibLength + 'px';

                        let transformWindowX = transformWindowCoords.x,
                            transformWindowY = transformWindowCoords.y;

                        setTransformWindowCoords({
                            x: transformWindowX,
                            y: transformWindowY
                        });
                        setTransformWindowImageCoords({
                            x: -transformWindowX,
                            y: -transformWindowY
                        });

                        setLastCoords({
                            x: e.clientX,
                            y: e.clientY
                        });
                        setCrossedBorders({
                            min: false,
                            max: false
                        });
                    } else {
                        if (crossedBorders.min) return;
                        console.log('crossed min');

                        cutterWindowWrapper.style.width = cutterWindowWrapper.style.height = minCutterWindowSize.width + 'px';


                        let transformWindowX = transformWindowCoords.x,
                            transformWindowY = transformWindowCoords.y;


                        setTransformWindowCoords({
                            x: transformWindowX,
                            y: transformWindowY
                        });
                        setTransformWindowImageCoords({
                            x: -transformWindowX,
                            y: -transformWindowY
                        });

                        setLastCoords({
                            x: Math.floor(cutterWindowWrapperRect.left) + cutterWindowWrapperRect.width,
                            y: lastCoords.y
                        });
                        setCrossedBorders({
                            min: true,
                            max: false
                        });
                    }
                    break;

                case 'bottom-left':
                    if (
                        cutterWindowWrapperRect.left + (e.clientX - lastCoords.x) < cutterHolderRect.left ||
                        cutterWindowWrapperRect.bottom - (e.clientX - lastCoords.x) > cutterHolderRect.bottom
                    ) {
                        if (crossedBorders.max) return;
                        console.log('crossed max');

                        let newRibLength = Math.min(cutterWindowWrapperRect.right - cutterHolderRect.left, cutterHolderRect.bottom - cutterWindowWrapperRect.top);
                        cutterWindowWrapper.style.width = cutterWindowWrapper.style.height = newRibLength + 'px';

                        let transformWindowX = cutterHolderRect.width - (cutterHolderRect.right - cutterWindowWrapperRect.right + newRibLength),
                            transformWindowY = transformWindowCoords.y;

                        setTransformWindowCoords({
                            x: transformWindowX,
                            y: transformWindowY
                        });
                        setTransformWindowImageCoords({
                            x: -transformWindowX,
                            y: -transformWindowY
                        });

                        setLastCoords({
                            x: Math.floor(cutterWindowWrapperRect.right) - newRibLength,
                            y: e.clientY
                        });
                        setCrossedBorders({
                            min: false,
                            max: true
                        });
                    } else if (e.clientX <= cutterWindowWrapperRect.right - minCutterWindowSize.width) {
                        let newRibLength = Math.floor(cutterWindowWrapperRect.right) - e.clientX;
                        cutterWindowWrapper.style.width = cutterWindowWrapper.style.height = newRibLength + 'px';

                        let transformWindowX = cutterHolderRect.width - (cutterHolderRect.right - cutterWindowWrapperRect.right + newRibLength),
                            transformWindowY = transformWindowCoords.y;

                        setTransformWindowCoords({
                            x: transformWindowX,
                            y: transformWindowY
                        });
                        setTransformWindowImageCoords({
                            x: -transformWindowX,
                            y: -transformWindowY
                        });

                        setLastCoords({
                            x: e.clientX,
                            y: e.clientY
                        });
                        setCrossedBorders({
                            min: false,
                            max: false
                        });
                    } else {
                        if (crossedBorders.min) return;
                        console.log('crossed min');

                        cutterWindowWrapper.style.width = cutterWindowWrapper.style.height = minCutterWindowSize.width + 'px';


                        let transformWindowX = cutterHolderRect.width - (cutterHolderRect.right - cutterWindowWrapperRect.right + minCutterWindowSize.width),
                            transformWindowY = transformWindowCoords.y;


                        setTransformWindowCoords({
                            x: transformWindowX,
                            y: transformWindowY
                        });
                        setTransformWindowImageCoords({
                            x: -transformWindowX,
                            y: -transformWindowY
                        });

                        setLastCoords({
                            x: Math.floor(cutterWindowWrapperRect.right) - minCutterWindowSize.width,
                            y: lastCoords.y
                        });
                        setCrossedBorders({
                            min: true,
                            max: false
                        });
                    }
                    break;

                case 'left-top':
                    if (
                        cutterWindowWrapperRect.left + (e.clientX - lastCoords.x) < cutterHolderRect.left ||
                        cutterWindowWrapperRect.top + (e.clientX - lastCoords.x) < cutterHolderRect.top
                    ) {
                        if (crossedBorders.max) return;
                        console.log('crossed max');

                        let newRibLength = Math.min(cutterWindowWrapperRect.right - cutterHolderRect.left, cutterWindowWrapperRect.bottom - cutterHolderRect.top);
                        cutterWindowWrapper.style.width = cutterWindowWrapper.style.height = newRibLength + 'px';


                        let transformWindowX = cutterHolderRect.width - (cutterHolderRect.right - cutterWindowWrapperRect.right + newRibLength),
                            transformWindowY = cutterHolderRect.height - (cutterHolderRect.bottom - cutterWindowWrapperRect.bottom + newRibLength);


                        setTransformWindowCoords({
                            x: transformWindowX,
                            y: transformWindowY
                        });
                        setTransformWindowImageCoords({
                            x: -transformWindowX,
                            y: -transformWindowY
                        });

                        setLastCoords({
                            x: Math.floor(cutterWindowWrapperRect.right) - newRibLength,
                            y: e.clientY
                        });
                        setCrossedBorders({
                            min: false,
                            max: true
                        });
                    } else if (e.clientX <= cutterWindowWrapperRect.right - minCutterWindowSize.width) {
                        let newRibLength = Math.floor(cutterWindowWrapperRect.right) - e.clientX;
                        cutterWindowWrapper.style.width = cutterWindowWrapper.style.height = newRibLength + 'px';


                        let transformWindowX = cutterHolderRect.width - (cutterHolderRect.right - cutterWindowWrapperRect.right + newRibLength),
                            transformWindowY = cutterHolderRect.height - (cutterHolderRect.bottom - cutterWindowWrapperRect.bottom + newRibLength);


                        setTransformWindowCoords({
                            x: transformWindowX,
                            y: transformWindowY
                        });
                        setTransformWindowImageCoords({
                            x: -transformWindowX,
                            y: -transformWindowY
                        });

                        setLastCoords({
                            x: e.clientX,
                            y: e.clientY
                        });
                        setCrossedBorders({
                            min: false,
                            max: false
                        });
                    } else {
                        if (crossedBorders.min) return;
                        console.log('crossed min');

                        cutterWindowWrapper.style.width = cutterWindowWrapper.style.height = minCutterWindowSize.width + 'px';


                        let transformWindowX = cutterHolderRect.width - (cutterHolderRect.right - cutterWindowWrapperRect.right + minCutterWindowSize.width),
                            transformWindowY = cutterHolderRect.height - (cutterHolderRect.bottom - cutterWindowWrapperRect.bottom + minCutterWindowSize.height);

                        setTransformWindowCoords({
                            x: transformWindowX,
                            y: transformWindowY
                        });
                        setTransformWindowImageCoords({
                            x: -transformWindowX,
                            y: -transformWindowY
                        });

                        setLastCoords({
                            x: Math.floor(cutterWindowWrapperRect.right) - minCutterWindowSize.width,
                            y: lastCoords.y
                        });
                        setCrossedBorders({
                            min: true,
                            max: false
                        });
                    }
                    break;
            }
        };
        const mouseUpHandler = function (e) {
            setIsExpanderDragging(false);

            cutterWindow.current.style.cursor = 'move';
            document.getElementsByTagName('body')[0].style.cursor = 'default';
        };

        if (isExpanderDragging) {
            window.addEventListener('mousemove', mouseMoveHandler);
            window.addEventListener('mouseup', mouseUpHandler);
        }

        return () => {
            window.removeEventListener('mousemove', mouseMoveHandler);
            window.removeEventListener('mouseup', mouseUpHandler);
        };
    }, [isExpanderDragging, lastCoords, direction, minCutterWindowSize, transformWindowCoords, transformWindowImageCoords, crossedBorders]);
    //* cutter window expanders dragging ===========================================================


    //* cutter window dragging ===========================================================
    function cutterWindowMouseDown(e) {
        if (!e.cutterExpanderMouseDown) {
            let cutterWindowRect = cutterWindow.current.getBoundingClientRect();

            setStartWindowPoint({
                left: e.clientX - cutterWindowRect.left,
                top: e.clientY - cutterWindowRect.top,
                right: cutterWindowRect.right - e.clientX,
                bottom: cutterWindowRect.bottom - e.clientY,
            });
            setIsDragging(true);
            setLastLeft(e.clientX);
            setLastTop(e.clientY);
        }
    }

    useEffect(() => {
        const mouseMoveHandler = function (e) {
            let cutterWindow = document.getElementsByClassName('cutter-window')[0],
                cutterHolder = cutterWindow.parentElement,
                cutterWindowRect = cutterWindow.getBoundingClientRect(),
                cutterHolderRect = cutterHolder.getBoundingClientRect(),
                _lastLeft = lastLeft, transformWindowX = transformWindowCoords.x,
                windowImageTransformX = transformWindowImageCoords.x,
                _lastTop = lastTop, transformWindowY = transformWindowCoords.y,
                windowImageTransformY = transformWindowImageCoords.y;


            if (cutterWindowRect.left + e.movementX <= cutterHolderRect.left) {
                _lastLeft = cutterHolderRect.left + startWindowPoint.left;
                transformWindowX = 0;
                windowImageTransformX = 0;
            } else if (cutterWindowRect.right + e.movementX >= cutterHolderRect.right) {
                _lastLeft = cutterHolderRect.right - startWindowPoint.right;
                transformWindowX = cutterHolderRect.width - cutterWindowRect.width;
                windowImageTransformX = -transformWindowX;
            } else if ((e.movementX >= 0 && e.clientX >= lastLeft) || (e.movementX <= 0 && e.clientX <= lastLeft)) {
                _lastLeft = e.clientX;
                transformWindowX = transformWindowCoords.x + (e.clientX - lastLeft);
                windowImageTransformX = -transformWindowX;
            }

            if (cutterWindowRect.top + e.movementY <= cutterHolderRect.top) {
                _lastTop = cutterHolderRect.top + startWindowPoint.top;
                transformWindowY = 0;
                windowImageTransformY = 0;
            } else if (cutterWindowRect.bottom + e.movementY >= cutterHolderRect.bottom) {
                _lastTop = cutterHolderRect.bottom - startWindowPoint.bottom;
                transformWindowY = cutterHolderRect.height - cutterWindowRect.height;
                windowImageTransformY = -transformWindowY;
            } else if ((e.movementY >= 0 && e.clientY >= lastTop) || (e.movementY <= 0 && e.clientY <= lastTop)) {
                _lastTop = e.clientY;
                transformWindowY = transformWindowCoords.y + (e.clientY - lastTop);
                windowImageTransformY = -transformWindowY;
            }


            setLastLeft(_lastLeft);
            setLastTop(_lastTop);

            setTransformWindowCoords({
                x: transformWindowX,
                y: transformWindowY
            });

            setTransformWindowImageCoords({
                x: windowImageTransformX,
                y: windowImageTransformY
            });
        };
        const mouseUpHandler = function (e) {
            setIsDragging(false);
            // console.log('window up');
        };

        // console.log('window effect');

        if (isDragging) {
            // console.log('window dragging');
            window.addEventListener('mousemove', mouseMoveHandler);
            window.addEventListener('mouseup', mouseUpHandler);
        }

        return () => {
            window.removeEventListener('mousemove', mouseMoveHandler);
            window.removeEventListener('mouseup', mouseUpHandler);
        };
    }, [isDragging, lastLeft, lastTop, startWindowPoint, transformWindowImageCoords, transformWindowCoords]);
    //* cutter window dragging ===========================================================

    async function loadBtnHandler(e) {
        let canvas = document.createElement('canvas'),
            context = canvas.getContext('2d'),
            coef = loadedImage.current.width / backgroundImage.current.width,
            canvWidth = coef * cutterWindow.current.offsetWidth,
            canvHeight = coef * cutterWindow.current.offsetHeight;

        canvas.width = canvWidth;
        canvas.height = canvHeight;

        context.drawImage(loadedImage.current, transformWindowCoords.x * coef, transformWindowCoords.y * coef, canvWidth, canvHeight, 0, 0, canvWidth, canvHeight);

        let photoInput = document.getElementsByClassName('photo-input')[0],
            imgName = photoInput.files[0].name,
            imgType = photoInput.files[0].type,
            croppedImgDataURL = canvas.toDataURL(imgType, 1);

        try {
            let res = await axiosApi.post('/api/user/avatar', {
                mainImg: {
                    filename: imgName,
                    dataURL: loadedImage.current.src,
                },
                croppedImg: {
                    filename: imgName.substr(0, imgName.lastIndexOf('.')) + '_cropped' + imgName.substr(imgName.lastIndexOf('.')),
                    dataURL: croppedImgDataURL,
                }
            });
            if (res.status === 200) {
                modalCloseHandler();
                window.location.reload();
            }
        } catch (e) {
            console.log(e);
        }
    }

    function modalCloseHandler() {
        setPhotoValidationMessage('');
        setIsCutterActive(false);
        setPhotoModalActive(false);
    }

    return (
        <Modal show={photoModalActive}
               onHide={modalCloseHandler}
               dialogClassName="photo-modal">
            <Modal.Header closeButton>
                <Modal.Title>Загрузить фотографию</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <label htmlFor="photo-input" className="photo-input-label blue-btn">Выбрать фотографию</label>
                <input type="file" id="photo-input" className="photo-input" accept="image/*"
                       onChange={photoInputChange}/>
                {photoValidationMessage && <p className="validation-message">{photoValidationMessage}</p>}

                {
                    isCutterActive &&
                    <>
                        <div className="cutter noSelect">
                            <div className="cutter-wrap">
                                <div className="cutter-holder">
                                    <img
                                        src={loadedImageDataURL}
                                        id="photo-holder"
                                        alt="holder"
                                        ref={backgroundImage}
                                        width={cutterImageSize.width}
                                        height={cutterImageSize.height}
                                    />

                                    <div className="cutter-faded"/>

                                    <div
                                        className="cutter-window"
                                        style={{
                                            transform: `translate(${transformWindowCoords.x}px, ${transformWindowCoords.y}px)`
                                        }}
                                        onMouseDown={cutterWindowMouseDown}
                                        onDragStart={(e) => {
                                            e.preventDefault();
                                        }}
                                        ref={cutterWindow}
                                    >
                                        <div className="cutter-window__wrapper"
                                             style={{
                                                 width: cutterWindowWrapperSize.width + 'px',
                                                 height: cutterWindowWrapperSize.height + 'px',
                                             }}
                                        >
                                            <img
                                                src={loadedImageDataURL}
                                                id="photo-window"
                                                style={{
                                                    transform: `translate(${transformWindowImageCoords.x}px, ${transformWindowImageCoords.y}px)`
                                                }}
                                                alt="window"
                                                width={cutterImageSize.width}
                                                height={cutterImageSize.height}
                                            />
                                        </div>


                                        <div
                                            className="cutter-window__expander expander-top-right"
                                            onMouseDown={cutterExpanderMouseDown}
                                            data-direction="top-right"
                                            data-cursor="nesw-resize"
                                        />
                                        <div
                                            className="cutter-window__expander expander-right-bottom"
                                            onMouseDown={cutterExpanderMouseDown}
                                            data-direction="right-bottom"
                                            data-cursor="nwse-resize"
                                        />
                                        <div
                                            className="cutter-window__expander expander-bottom-left"
                                            onMouseDown={cutterExpanderMouseDown}
                                            data-direction="bottom-left"
                                            data-cursor="nesw-resize"
                                        />
                                        <div
                                            className="cutter-window__expander expander-left-top"
                                            onMouseDown={cutterExpanderMouseDown}
                                            data-direction="left-top"
                                            data-cursor="nwse-resize"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={loadBtnHandler} className="cutter-load-btn blue-btn">Загрузить</button>
                    </>
                }
            </Modal.Body>
        </Modal
        >
    );
}