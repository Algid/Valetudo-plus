const SerializableEntity = require("../SerializableEntity");

// noinspection JSCheckFunctionSignatures
class ValetudoMapEntry extends SerializableEntity {
    /**
     *
     * @param {object} options
     * @param {string} options.id
     * @param {string} options.name
     * @param {boolean} options.active
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.id = options.id;
        this.name = options.name;
        this.active = options.active;
    }
}

module.exports = ValetudoMapEntry;
