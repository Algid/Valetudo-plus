import BaseZoneClientStructure from "./BaseZoneClientStructure";

class ZoneClientStructure extends BaseZoneClientStructure {
    public static readonly TYPE = "ZoneClientStructure";

    protected activeStyle : { stroke: string, fill: string } = {
        stroke: "rgb(255, 255, 255)",
        fill: "rgba(255, 255, 255, 0)"
    };

    protected style : { stroke: string, fill: string } = {
        stroke: "rgb(255, 255, 255)",
        fill: "rgba(255, 255, 255, 0.4)"
    };
}

export default ZoneClientStructure;
