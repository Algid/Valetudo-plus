const capabilities = require("./capabilities");
const DustBinFullValetudoEvent = require("../../valetudo_events/events/DustBinFullValetudoEvent");
const entities = require("../../entities");
const ErrorStateValetudoEvent = require("../../valetudo_events/events/ErrorStateValetudoEvent");
const MopAttachmentReminderValetudoEvent = require("../../valetudo_events/events/MopAttachmentReminderValetudoEvent");
const PendingMapChangeValetudoEvent = require("../../valetudo_events/events/PendingMapChangeValetudoEvent");
const Tools = require("../../utils/Tools");
const ValetudoRobot = require("../../core/ValetudoRobot");
const { MapLayer, PointMapEntity, ValetudoMap } = require("../../entities/map");
const stateAttrs = entities.state.attributes;

class MockValetudoRobot extends ValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     */
    constructor(options) {
        super(options);
        this.buildMap();

        this.registerCapability(new capabilities.MockBasicControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockCarpetModeControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockConsumableMonitoringCapability({robot: this}));
        this.registerCapability(new capabilities.MockDoNotDisturbCapability({robot: this}));
        this.registerCapability(new capabilities.MockFanSpeedControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockWaterUsageControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockSpeakerVolumeControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockSpeakerTestCapability({robot: this}));
        this.registerCapability(new capabilities.MockSpeakerPlayAudioCapability({robot: this}));
        this.registerCapability(new capabilities.MockKeyLockCapability({robot: this}));
        this.registerCapability(new capabilities.MockObstacleAvoidanceControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockLocateCapability({robot: this}));
        this.registerCapability(new capabilities.MockWifiConfigurationCapability({robot: this}));
        this.registerCapability(new capabilities.MockWifiScanCapability({robot: this}));
        this.registerCapability(new capabilities.MockGoToLocationCapability({robot: this}));
        this.registerCapability(new capabilities.MockMapResetCapability({robot: this}));
        this.registerCapability(new capabilities.MockPersistentMapControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockPendingMapChangeHandlingCapability({robot: this}));
        this.registerCapability(new capabilities.MockMapSegmentationCapability({robot: this}));
        this.registerCapability(new capabilities.MockMapSegmentRenameCapability({robot: this}));
        this.registerCapability(new capabilities.MockMapSegmentCleanOrderCapability({robot: this}));
        this.registerCapability(new capabilities.MockCombinedVirtualRestrictionsCapability({robot: this}));
        this.registerCapability(new capabilities.MockMultipleMapCapability({robot: this}));
        this.registerCapability(new capabilities.MockMultipleMapDeleteCapability({robot: this}));
        this.registerCapability(new capabilities.MockMultipleMapRenameCapability({robot: this}));
        this.registerCapability(new capabilities.MockMultipleMapRotateCapability({robot: this}));
        this.registerCapability(new capabilities.MockZoneCleaningCapability({robot: this}));
        this.registerCapability(new capabilities.MockAutoEmptyDockManualTriggerCapability({robot: this}));
        this.registerCapability(new capabilities.MockAutoEmptyDockAutoEmptyIntervalControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockMappingPassCapability({robot: this}));
        this.registerCapability(new capabilities.MockVoicePackManagementCapability({robot: this}));
        this.registerCapability(new capabilities.MockManualControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockCurrentStatisticsCapability({robot: this}));
        this.registerCapability(new capabilities.MockTotalStatisticsCapability({robot: this}));
        this.registerCapability(new capabilities.MockOperationModeControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockPetObstacleAvoidanceControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockCollisionAvoidantNavigationControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockCarpetSensorModeControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockMopDockCleanManualTriggerCapability({robot: this}));
        this.registerCapability(new capabilities.MockMopDockDryManualTriggerCapability({robot: this}));

        // Raise events to make them visible in the UI
        options.valetudoEventStore.raise(new DustBinFullValetudoEvent({}));
        options.valetudoEventStore.raise(new MopAttachmentReminderValetudoEvent({}));
        options.valetudoEventStore.raise(new PendingMapChangeValetudoEvent({}));
        options.valetudoEventStore.raise(new ErrorStateValetudoEvent({
            message: "This is an error message"
        }));

        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.DockStatusStateAttribute({
            value: entities.state.attributes.DockStatusStateAttribute.VALUE.IDLE
        }));
    }

    getManufacturer() {
        return "Valetudo";
    }

    getModelName() {
        return "MockValetudoRobot";
    }

    getModelDetails() {
        return Object.assign(
            {},
            super.getModelDetails(),
            {
                supportedAttachments: [
                    stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN,
                    stateAttrs.AttachmentStateAttribute.TYPE.WATERTANK,
                    stateAttrs.AttachmentStateAttribute.TYPE.MOP,
                ]
            }
        );
    }

    /**
     * @return {object}
     */
    getProperties() {
        const superProps = super.getProperties();
        const ourProps = {
            [MockValetudoRobot.WELL_KNOWN_PROPERTIES.FIRMWARE_VERSION]: Tools.GET_VALETUDO_VERSION()
        };

        return Object.assign(
            {},
            superProps,
            ourProps
        );
    }

    /**
     * @public
     */
    emitStateUpdated() {
        super.emitStateUpdated();
    }

    /**
     * @public
     */
    emitStateAttributesUpdated() {
        super.emitStateAttributesUpdated();
    }

    /**
     * @public
     */
    emitMapUpdated() {
        super.emitMapUpdated();
    }

    /**
     * @public
     */
    buildMap() {
        this.mockMap = {
            size: 300 * 5,
            pixelSize: 5,
            range: {
                min: 100,
                max: 200
            }
        };
        this.state.map = new ValetudoMap({
            metaData: {
                pendingMapChange: true,
                rotation: 90
            },
            size: {
                x: this.mockMap.size,
                y: this.mockMap.size
            },
            pixelSize: this.mockMap.pixelSize,
            layers: [this.buildFloor(), this.buildWall(), ...this.buildSegments()],
            entities: [this.buildCharger(), this.buildRobot()]
        });
        this.emitMapUpdated();
    }

    /**
     * @private
     */
    buildFloor() {
        let pixels = [];
        for (let x = this.mockMap.range.min; x <= this.mockMap.range.max; x++) {
            for (let y = this.mockMap.range.min; y <= this.mockMap.range.max; y++) {
                pixels.push(x, y);
            }
        }

        return new MapLayer({
            type: MapLayer.TYPE.FLOOR,
            pixels: pixels
        });
    }

    /**
     * @private
     */
    buildSegments() {
        let pixels1 = [];
        let pixels2 = [];

        const height = this.mockMap.range.max - this.mockMap.range.min;
        for (let x = this.mockMap.range.min; x <= this.mockMap.range.max; x++) {
            for (let y = this.mockMap.range.min; y < this.mockMap.range.max - height / 2; y++) {
                pixels1.push(x, y);
            }

            for (let y = this.mockMap.range.max - height / 2; y <= this.mockMap.range.max; y++) {
                pixels2.push(x, y);
            }
        }

        return [
            new MapLayer({
                type: MapLayer.TYPE.SEGMENT,
                pixels: pixels1,
                metaData: {
                    segmentId: "1",
                    name: "Main",
                    active: false,
                    cleanOrder: 1,
                }
            }),
            new MapLayer({
                type: MapLayer.TYPE.SEGMENT,
                pixels: pixels2,
                metaData: {
                    segmentId: "2",
                    active: false,
                    cleanOrder: 2,
                }
            })
        ];
    }

    /**
     * @private
     */
    buildWall() {
        let pixels = [];
        for (let x = this.mockMap.range.min; x <= this.mockMap.range.max; x++) {
            pixels.push(x, this.mockMap.range.min, x, this.mockMap.range.max);
        }
        for (let y = this.mockMap.range.min; y <= this.mockMap.range.max; y++) {
            pixels.push(this.mockMap.range.min, y, this.mockMap.range.max, y);
        }
        return new MapLayer({
            type: MapLayer.TYPE.WALL,
            pixels: pixels
        });
    }

    /**
     * @private
     */
    buildCharger() {
        return new PointMapEntity({
            type: PointMapEntity.TYPE.CHARGER_LOCATION,
            points: [this.mockMap.range.min * this.mockMap.pixelSize + 50, this.mockMap.range.min * this.mockMap.pixelSize]
        });
    }

    /**
     * @private
     */
    buildRobot() {
        return new PointMapEntity({
            type: PointMapEntity.TYPE.ROBOT_POSITION,
            points: [this.mockMap.range.min * this.mockMap.pixelSize + 50, this.mockMap.range.min * this.mockMap.pixelSize + 50],
            metaData: {
                angle: 180
            }
        });
    }
}

module.exports = MockValetudoRobot;
