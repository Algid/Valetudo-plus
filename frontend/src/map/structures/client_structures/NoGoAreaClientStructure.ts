import BaseZoneClientStructure from "./BaseZoneClientStructure";

class NoGoAreaClientStructure extends BaseZoneClientStructure {
    public static readonly TYPE = "NoGoAreaClientStructure";

    protected activeStyle : { stroke: string, fill: string } = {
        stroke: "rgb(239, 68, 68)",
        fill: "rgba(239, 68, 68, 0)"
    };

    protected style : { stroke: string, fill: string } = {
        stroke: "rgb(239, 68, 68)",
        fill: "rgba(239, 68, 68, 0.4)"
    };
}

export default NoGoAreaClientStructure;
