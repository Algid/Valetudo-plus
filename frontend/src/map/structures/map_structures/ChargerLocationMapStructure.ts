import MapStructure from "./MapStructure";
import chargerIconSVG from "../icons/charger.svg";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {considerHiDPI} from "../../utils/helpers";

const img = new Image();
img.src = chargerIconSVG;

class ChargerLocationMapStructure extends MapStructure {
    public static readonly TYPE = "ChargerLocationMapStructure";

    constructor(x0: number, y0: number) {
        super(x0, y0);
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number, pixelSize: number, rotationRads: number): void {
        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);

        const scaledSize = {
            width: considerHiDPI(img.width) / (considerHiDPI(4.5) / scaleFactor),
            height: considerHiDPI(img.height) / (considerHiDPI(4.5) / scaleFactor)
        };

        const rotateCharger = (source: CanvasImageSource, size: {width: number, height: number}) => {
            const imgWidth = Math.round(size.width);
            const imgHeight = Math.round(size.height);

            // Leave room for rotation if required
            const canvasWidth = imgWidth * 1.5;
            const canvasHeight = imgHeight * 1.5;

            const canvasimg = document.createElement("canvas");
            canvasimg.width = canvasWidth;
            canvasimg.height = canvasHeight;
            const ctximg = canvasimg.getContext("2d");

            if (ctximg) {
                ctximg.translate(canvasWidth / 2, canvasHeight / 2);
                ctximg.rotate(rotationRads);
                ctximg.translate(-canvasWidth / 2, -canvasHeight / 2);

                ctximg.translate((canvasWidth / 2) - (imgWidth / 2), (canvasHeight / 2) - (imgHeight / 2));
                ctximg.drawImage(source, 0, 0, imgWidth, imgHeight);
            }

            return canvasimg;
        };

        const rotatedImg = rotateCharger(
            this.getOptimizedImage(img, scaledSize.width, scaledSize.height),
            scaledSize,
        );

        ctx.drawImage(
            rotatedImg,
            p0.x - rotatedImg.width / 2,
            p0.y - rotatedImg.height / 2,
            rotatedImg.width,
            rotatedImg.height
        );
    }
}

export default ChargerLocationMapStructure;
