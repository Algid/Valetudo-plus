import ClientStructure from "./ClientStructure";
import deleteButtonIconSVG from "../icons/delete_zone.svg";
import scaleButtonIconSVG from "../icons/scale_zone.svg";
import {StructureInterceptionHandlerResult} from "../Structure";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {PointCoordinates} from "../../utils/types";
import {calculateBoxAroundPoint, considerHiDPI, isInsideBox} from "../../utils/helpers";

const img_delete_button = new Image();
img_delete_button.src = deleteButtonIconSVG;

const img_scale_button = new Image();
img_scale_button.src = scaleButtonIconSVG;

const buttonHitboxPadding = 22.5;

abstract class BaseZoneClientStructure extends ClientStructure {
    protected activeStyle : { stroke: string, fill: string } = {
        stroke: "rgb(0, 255, 0)",
        fill: "rgba(0, 255, 0, 0)"
    };

    protected style : { stroke: string, fill: string } = {
        stroke: "rgb(0, 255, 0)",
        fill: "rgba(0, 255, 0, 0.4)"
    };

    public x1: number;
    public y1: number;
    public x2: number;
    public y2: number;
    public x3: number;
    public y3: number;

    private boxHitbox = {
        topLeftBound: new DOMPoint(),
        bottomRightBound: new DOMPoint()
    };

    private rotationOffset = 0;
    private labelPoint = new DOMPoint();
    private deletePoint = new DOMPoint();
    private resizePoint = new DOMPoint();

    constructor(
        x0: number, y0: number,
        x1: number, y1: number,
        x2: number, y2: number,
        x3: number, y3: number,
        active?: boolean
    ) {
        super(x0, y0);

        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.x3 = x3;
        this.y3 = y3;

        this.active = active ?? true;
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number, pixelSize: number, rotationRads: number): void {
        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformationMatrixToScreenSpace);
        const p3 = new DOMPoint(this.x3, this.y3).matrixTransform(transformationMatrixToScreenSpace);

        this.rotationOffset = Math.floor((rotationRads + Math.PI * 0.25) / (Math.PI * 0.5));

        // TODO Algid: In an ideal world we should unrotate the delete & resize points too but
        // this led to quite a few issues so I will probably revisit it in the future.
        const points = { p0: p0, p1: p1, p2: p2, p3: p3 };

        this.labelPoint = points[this.getUnrotatedKey("p", 0)];
        this.deletePoint = p1;
        this.resizePoint = p2;

        const dimensions = {
            x: ((Math.round(this.x2) - Math.round(this.x0)) * pixelSize) / 100,
            y: ((Math.round(this.y2) - Math.round(this.y0)) * pixelSize) / 100
        };
        const label = dimensions.x.toFixed(2) + " x " + dimensions.y.toFixed(2) + "m";

        ctxWrapper.save();

        ctx.lineWidth = considerHiDPI(5);
        ctx.lineCap = "round";

        if (!this.active) {
            ctx.strokeStyle = this.style.stroke;
            ctx.fillStyle = this.style.fill;
        } else {
            ctx.setLineDash([
                considerHiDPI(8),
                considerHiDPI(6)
            ]);
            ctx.strokeStyle = this.style.stroke;
            ctx.fillStyle = this.style.fill;
        }

        ctx.save();
        ctx.strokeStyle = "rgba(0,0,0, 0.8)";
        ctx.lineWidth = ctx.lineWidth + considerHiDPI(2);

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();

        ctx.stroke();

        ctx.restore();


        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();


        ctxWrapper.restore();


        if (this.active) {
            const scaledDeleteButtonSize = {
                width: Math.min(
                    considerHiDPI(img_delete_button.width) * (scaleFactor / considerHiDPI(5.5)),
                    considerHiDPI(70)
                ),
                height: Math.min(
                    considerHiDPI(img_delete_button.height) * (scaleFactor / considerHiDPI(5.5)),
                    considerHiDPI(70)
                )
            };
            const scaledScaleButtonSize = {
                width: Math.min(
                    considerHiDPI(img_scale_button.width) * (scaleFactor / considerHiDPI(5.5)),
                    considerHiDPI(70)
                ),
                height: Math.min(
                    considerHiDPI(img_scale_button.height) * (scaleFactor / considerHiDPI(5.5)),
                    considerHiDPI(70)
                )
            };

            ctx.drawImage(
                this.getOptimizedImage(img_delete_button, scaledDeleteButtonSize.width, scaledDeleteButtonSize.height),
                this.deletePoint.x - scaledDeleteButtonSize.width / 2,
                this.deletePoint.y - scaledDeleteButtonSize.height / 2,
                scaledDeleteButtonSize.width,
                scaledDeleteButtonSize.height
            );

            ctx.drawImage(
                this.getOptimizedImage(img_scale_button, scaledScaleButtonSize.width, scaledScaleButtonSize.height),
                this.resizePoint.x - scaledScaleButtonSize.width / 2,
                this.resizePoint.y - scaledScaleButtonSize.height / 2,
                scaledScaleButtonSize.width,
                scaledScaleButtonSize.height
            );

            ctxWrapper.save();
            const fontSize = 4 * scaleFactor;
            if (fontSize >= 20) {
                ctx.textAlign = "start";
                ctx.fillStyle = "rgba(255, 255, 255, 1)";
                ctx.strokeStyle = "rgba(18, 18, 18, 1)";
                ctx.font = `${fontSize}px "IBM Plex Sans", "Helvetica", sans-serif`;

                ctx.lineWidth = considerHiDPI(3);
                ctx.strokeText(label, this.labelPoint.x, this.labelPoint.y - considerHiDPI(8));

                ctx.lineWidth = considerHiDPI(1);
                ctx.fillText(label, this.labelPoint.x, this.labelPoint.y - considerHiDPI(8));
            }
            ctxWrapper.restore();
        }

        const mapSpaceTransformationMatrix = DOMMatrix.fromMatrix(transformationMatrixToScreenSpace).invertSelf();

        this.boxHitbox.topLeftBound = p0.matrixTransform(mapSpaceTransformationMatrix);
        this.boxHitbox.bottomRightBound = p2.matrixTransform(mapSpaceTransformationMatrix);
    }

    postProcess(): void {
        this.x0 = Math.round(this.x0);
        this.y0 = Math.round(this.y0);

        this.x1 = Math.round(this.x1);
        this.y1 = Math.round(this.y1);

        this.x2 = Math.round(this.x2);
        this.y2 = Math.round(this.y2);

        this.x3 = Math.round(this.x3);
        this.y3 = Math.round(this.y3);
    }

    tap(tappedPoint : PointCoordinates, transformationMatrixToScreenSpace: DOMMatrixInit) : StructureInterceptionHandlerResult {
        const mapSpaceTransformationMatrix = DOMMatrix.fromMatrix(transformationMatrixToScreenSpace).invertSelf();

        const deleteButtonHitbox = calculateBoxAroundPoint(this.deletePoint, buttonHitboxPadding);
        const mapTappedPoint = new DOMPoint(tappedPoint.x,tappedPoint.y).matrixTransform(mapSpaceTransformationMatrix);

        if (this.active && isInsideBox(tappedPoint, deleteButtonHitbox)) {
            return {
                deleteMe: true,
                stopPropagation: true
            };
        } else if (isInsideBox(mapTappedPoint, this.boxHitbox)) {
            this.active = true;

            return {
                stopPropagation: true
            };
        } else if (this.active) {
            this.active = false;

            return {
                stopPropagation: false,
                requestDraw: true
            };
        } else {
            return {
                stopPropagation: false
            };
        }
    }

    translate(startCoordinates: PointCoordinates, lastCoordinates: PointCoordinates, currentCoordinates: PointCoordinates, transformationMatrixToScreenSpace : DOMMatrixInit, pixelSize: number) : StructureInterceptionHandlerResult {
        if (this.active) {
            const resizeButtonHitbox = calculateBoxAroundPoint(this.resizePoint, buttonHitboxPadding);

            if (!this.isResizing && isInsideBox(lastCoordinates, resizeButtonHitbox)) {
                this.isResizing = true;
            }

            const {
                dx,
                dy,
                lastInMapSpace,
                currentInMapSpace
            } = ClientStructure.calculateTranslateDelta(lastCoordinates, currentCoordinates, transformationMatrixToScreenSpace);


            if (this.isResizing) {
                if (currentInMapSpace.x > this.x0 + pixelSize && this.x1 + dx > this.x0 + pixelSize) {
                    this.x1 += dx;
                    this.x2 += dx;
                }
                if (currentInMapSpace.y > this.y0 + pixelSize && this.y2 + dy > this.y0 + pixelSize) {
                    this.y2 += dy;
                    this.y3 += dy;
                }

                return {
                    stopPropagation: true
                };
            } else if (isInsideBox(lastInMapSpace, this.boxHitbox)) {
                this.x0 += dx;
                this.y0 += dy;
                this.x1 += dx;
                this.y1 += dy;
                this.x2 += dx;
                this.y2 += dy;
                this.x3 += dx;
                this.y3 += dy;

                return {
                    stopPropagation: true
                };
            } else {
                this.active = false;
            }
        }

        return {
            stopPropagation: false
        };
    }

    /**
     * Get unrotated point key
     * @param {string} prefix
     * @param {number} index
     * @returns {string}
     */
    getUnrotatedKey<Prefix extends string>(prefix: Prefix, index: (0 | 1 | 2 | 3)): `${Prefix}${0 | 1 | 2 | 3}` {
        const indexes: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3];
        const newIndex = indexes.at(index - this.rotationOffset);

        if (newIndex === undefined) {
            throw Error("Failed to get unrotated key for index " + index);
        }

        return `${prefix}${newIndex}`;
    }
}

export default BaseZoneClientStructure;
