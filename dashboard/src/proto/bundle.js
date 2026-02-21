/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const bayesmech = $root.bayesmech = (() => {

    /**
     * Namespace bayesmech.
     * @exports bayesmech
     * @namespace
     */
    const bayesmech = {};

    bayesmech.vision = (function() {

        /**
         * Namespace vision.
         * @memberof bayesmech
         * @namespace
         */
        const vision = {};

        vision.Pose = (function() {

            /**
             * Properties of a Pose.
             * @memberof bayesmech.vision
             * @interface IPose
             * @property {bayesmech.vision.IVector3|null} [position] Pose position
             * @property {bayesmech.vision.IQuaternion|null} [rotation] Pose rotation
             */

            /**
             * Constructs a new Pose.
             * @memberof bayesmech.vision
             * @classdesc Represents a Pose.
             * @implements IPose
             * @constructor
             * @param {bayesmech.vision.IPose=} [properties] Properties to set
             */
            function Pose(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Pose position.
             * @member {bayesmech.vision.IVector3|null|undefined} position
             * @memberof bayesmech.vision.Pose
             * @instance
             */
            Pose.prototype.position = null;

            /**
             * Pose rotation.
             * @member {bayesmech.vision.IQuaternion|null|undefined} rotation
             * @memberof bayesmech.vision.Pose
             * @instance
             */
            Pose.prototype.rotation = null;

            /**
             * Creates a new Pose instance using the specified properties.
             * @function create
             * @memberof bayesmech.vision.Pose
             * @static
             * @param {bayesmech.vision.IPose=} [properties] Properties to set
             * @returns {bayesmech.vision.Pose} Pose instance
             */
            Pose.create = function create(properties) {
                return new Pose(properties);
            };

            /**
             * Encodes the specified Pose message. Does not implicitly {@link bayesmech.vision.Pose.verify|verify} messages.
             * @function encode
             * @memberof bayesmech.vision.Pose
             * @static
             * @param {bayesmech.vision.IPose} message Pose message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Pose.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.position != null && Object.hasOwnProperty.call(message, "position"))
                    $root.bayesmech.vision.Vector3.encode(message.position, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.rotation != null && Object.hasOwnProperty.call(message, "rotation"))
                    $root.bayesmech.vision.Quaternion.encode(message.rotation, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified Pose message, length delimited. Does not implicitly {@link bayesmech.vision.Pose.verify|verify} messages.
             * @function encodeDelimited
             * @memberof bayesmech.vision.Pose
             * @static
             * @param {bayesmech.vision.IPose} message Pose message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Pose.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Pose message from the specified reader or buffer.
             * @function decode
             * @memberof bayesmech.vision.Pose
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {bayesmech.vision.Pose} Pose
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Pose.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.bayesmech.vision.Pose();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.position = $root.bayesmech.vision.Vector3.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.rotation = $root.bayesmech.vision.Quaternion.decode(reader, reader.uint32());
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Pose message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof bayesmech.vision.Pose
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {bayesmech.vision.Pose} Pose
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Pose.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Pose message.
             * @function verify
             * @memberof bayesmech.vision.Pose
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Pose.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.position != null && message.hasOwnProperty("position")) {
                    let error = $root.bayesmech.vision.Vector3.verify(message.position);
                    if (error)
                        return "position." + error;
                }
                if (message.rotation != null && message.hasOwnProperty("rotation")) {
                    let error = $root.bayesmech.vision.Quaternion.verify(message.rotation);
                    if (error)
                        return "rotation." + error;
                }
                return null;
            };

            /**
             * Creates a Pose message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof bayesmech.vision.Pose
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {bayesmech.vision.Pose} Pose
             */
            Pose.fromObject = function fromObject(object) {
                if (object instanceof $root.bayesmech.vision.Pose)
                    return object;
                let message = new $root.bayesmech.vision.Pose();
                if (object.position != null) {
                    if (typeof object.position !== "object")
                        throw TypeError(".bayesmech.vision.Pose.position: object expected");
                    message.position = $root.bayesmech.vision.Vector3.fromObject(object.position);
                }
                if (object.rotation != null) {
                    if (typeof object.rotation !== "object")
                        throw TypeError(".bayesmech.vision.Pose.rotation: object expected");
                    message.rotation = $root.bayesmech.vision.Quaternion.fromObject(object.rotation);
                }
                return message;
            };

            /**
             * Creates a plain object from a Pose message. Also converts values to other types if specified.
             * @function toObject
             * @memberof bayesmech.vision.Pose
             * @static
             * @param {bayesmech.vision.Pose} message Pose
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Pose.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.position = null;
                    object.rotation = null;
                }
                if (message.position != null && message.hasOwnProperty("position"))
                    object.position = $root.bayesmech.vision.Vector3.toObject(message.position, options);
                if (message.rotation != null && message.hasOwnProperty("rotation"))
                    object.rotation = $root.bayesmech.vision.Quaternion.toObject(message.rotation, options);
                return object;
            };

            /**
             * Converts this Pose to JSON.
             * @function toJSON
             * @memberof bayesmech.vision.Pose
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Pose.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Pose
             * @function getTypeUrl
             * @memberof bayesmech.vision.Pose
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Pose.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/bayesmech.vision.Pose";
            };

            return Pose;
        })();

        vision.Vector3 = (function() {

            /**
             * Properties of a Vector3.
             * @memberof bayesmech.vision
             * @interface IVector3
             * @property {number|null} [x] Vector3 x
             * @property {number|null} [y] Vector3 y
             * @property {number|null} [z] Vector3 z
             */

            /**
             * Constructs a new Vector3.
             * @memberof bayesmech.vision
             * @classdesc Represents a Vector3.
             * @implements IVector3
             * @constructor
             * @param {bayesmech.vision.IVector3=} [properties] Properties to set
             */
            function Vector3(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Vector3 x.
             * @member {number} x
             * @memberof bayesmech.vision.Vector3
             * @instance
             */
            Vector3.prototype.x = 0;

            /**
             * Vector3 y.
             * @member {number} y
             * @memberof bayesmech.vision.Vector3
             * @instance
             */
            Vector3.prototype.y = 0;

            /**
             * Vector3 z.
             * @member {number} z
             * @memberof bayesmech.vision.Vector3
             * @instance
             */
            Vector3.prototype.z = 0;

            /**
             * Creates a new Vector3 instance using the specified properties.
             * @function create
             * @memberof bayesmech.vision.Vector3
             * @static
             * @param {bayesmech.vision.IVector3=} [properties] Properties to set
             * @returns {bayesmech.vision.Vector3} Vector3 instance
             */
            Vector3.create = function create(properties) {
                return new Vector3(properties);
            };

            /**
             * Encodes the specified Vector3 message. Does not implicitly {@link bayesmech.vision.Vector3.verify|verify} messages.
             * @function encode
             * @memberof bayesmech.vision.Vector3
             * @static
             * @param {bayesmech.vision.IVector3} message Vector3 message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Vector3.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.x != null && Object.hasOwnProperty.call(message, "x"))
                    writer.uint32(/* id 1, wireType 5 =*/13).float(message.x);
                if (message.y != null && Object.hasOwnProperty.call(message, "y"))
                    writer.uint32(/* id 2, wireType 5 =*/21).float(message.y);
                if (message.z != null && Object.hasOwnProperty.call(message, "z"))
                    writer.uint32(/* id 3, wireType 5 =*/29).float(message.z);
                return writer;
            };

            /**
             * Encodes the specified Vector3 message, length delimited. Does not implicitly {@link bayesmech.vision.Vector3.verify|verify} messages.
             * @function encodeDelimited
             * @memberof bayesmech.vision.Vector3
             * @static
             * @param {bayesmech.vision.IVector3} message Vector3 message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Vector3.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Vector3 message from the specified reader or buffer.
             * @function decode
             * @memberof bayesmech.vision.Vector3
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {bayesmech.vision.Vector3} Vector3
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Vector3.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.bayesmech.vision.Vector3();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.x = reader.float();
                            break;
                        }
                    case 2: {
                            message.y = reader.float();
                            break;
                        }
                    case 3: {
                            message.z = reader.float();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Vector3 message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof bayesmech.vision.Vector3
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {bayesmech.vision.Vector3} Vector3
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Vector3.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Vector3 message.
             * @function verify
             * @memberof bayesmech.vision.Vector3
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Vector3.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.x != null && message.hasOwnProperty("x"))
                    if (typeof message.x !== "number")
                        return "x: number expected";
                if (message.y != null && message.hasOwnProperty("y"))
                    if (typeof message.y !== "number")
                        return "y: number expected";
                if (message.z != null && message.hasOwnProperty("z"))
                    if (typeof message.z !== "number")
                        return "z: number expected";
                return null;
            };

            /**
             * Creates a Vector3 message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof bayesmech.vision.Vector3
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {bayesmech.vision.Vector3} Vector3
             */
            Vector3.fromObject = function fromObject(object) {
                if (object instanceof $root.bayesmech.vision.Vector3)
                    return object;
                let message = new $root.bayesmech.vision.Vector3();
                if (object.x != null)
                    message.x = Number(object.x);
                if (object.y != null)
                    message.y = Number(object.y);
                if (object.z != null)
                    message.z = Number(object.z);
                return message;
            };

            /**
             * Creates a plain object from a Vector3 message. Also converts values to other types if specified.
             * @function toObject
             * @memberof bayesmech.vision.Vector3
             * @static
             * @param {bayesmech.vision.Vector3} message Vector3
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Vector3.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.x = 0;
                    object.y = 0;
                    object.z = 0;
                }
                if (message.x != null && message.hasOwnProperty("x"))
                    object.x = options.json && !isFinite(message.x) ? String(message.x) : message.x;
                if (message.y != null && message.hasOwnProperty("y"))
                    object.y = options.json && !isFinite(message.y) ? String(message.y) : message.y;
                if (message.z != null && message.hasOwnProperty("z"))
                    object.z = options.json && !isFinite(message.z) ? String(message.z) : message.z;
                return object;
            };

            /**
             * Converts this Vector3 to JSON.
             * @function toJSON
             * @memberof bayesmech.vision.Vector3
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Vector3.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Vector3
             * @function getTypeUrl
             * @memberof bayesmech.vision.Vector3
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Vector3.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/bayesmech.vision.Vector3";
            };

            return Vector3;
        })();

        vision.Quaternion = (function() {

            /**
             * Properties of a Quaternion.
             * @memberof bayesmech.vision
             * @interface IQuaternion
             * @property {number|null} [x] Quaternion x
             * @property {number|null} [y] Quaternion y
             * @property {number|null} [z] Quaternion z
             * @property {number|null} [w] Quaternion w
             */

            /**
             * Constructs a new Quaternion.
             * @memberof bayesmech.vision
             * @classdesc Represents a Quaternion.
             * @implements IQuaternion
             * @constructor
             * @param {bayesmech.vision.IQuaternion=} [properties] Properties to set
             */
            function Quaternion(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Quaternion x.
             * @member {number} x
             * @memberof bayesmech.vision.Quaternion
             * @instance
             */
            Quaternion.prototype.x = 0;

            /**
             * Quaternion y.
             * @member {number} y
             * @memberof bayesmech.vision.Quaternion
             * @instance
             */
            Quaternion.prototype.y = 0;

            /**
             * Quaternion z.
             * @member {number} z
             * @memberof bayesmech.vision.Quaternion
             * @instance
             */
            Quaternion.prototype.z = 0;

            /**
             * Quaternion w.
             * @member {number} w
             * @memberof bayesmech.vision.Quaternion
             * @instance
             */
            Quaternion.prototype.w = 0;

            /**
             * Creates a new Quaternion instance using the specified properties.
             * @function create
             * @memberof bayesmech.vision.Quaternion
             * @static
             * @param {bayesmech.vision.IQuaternion=} [properties] Properties to set
             * @returns {bayesmech.vision.Quaternion} Quaternion instance
             */
            Quaternion.create = function create(properties) {
                return new Quaternion(properties);
            };

            /**
             * Encodes the specified Quaternion message. Does not implicitly {@link bayesmech.vision.Quaternion.verify|verify} messages.
             * @function encode
             * @memberof bayesmech.vision.Quaternion
             * @static
             * @param {bayesmech.vision.IQuaternion} message Quaternion message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Quaternion.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.x != null && Object.hasOwnProperty.call(message, "x"))
                    writer.uint32(/* id 1, wireType 5 =*/13).float(message.x);
                if (message.y != null && Object.hasOwnProperty.call(message, "y"))
                    writer.uint32(/* id 2, wireType 5 =*/21).float(message.y);
                if (message.z != null && Object.hasOwnProperty.call(message, "z"))
                    writer.uint32(/* id 3, wireType 5 =*/29).float(message.z);
                if (message.w != null && Object.hasOwnProperty.call(message, "w"))
                    writer.uint32(/* id 4, wireType 5 =*/37).float(message.w);
                return writer;
            };

            /**
             * Encodes the specified Quaternion message, length delimited. Does not implicitly {@link bayesmech.vision.Quaternion.verify|verify} messages.
             * @function encodeDelimited
             * @memberof bayesmech.vision.Quaternion
             * @static
             * @param {bayesmech.vision.IQuaternion} message Quaternion message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Quaternion.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Quaternion message from the specified reader or buffer.
             * @function decode
             * @memberof bayesmech.vision.Quaternion
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {bayesmech.vision.Quaternion} Quaternion
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Quaternion.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.bayesmech.vision.Quaternion();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.x = reader.float();
                            break;
                        }
                    case 2: {
                            message.y = reader.float();
                            break;
                        }
                    case 3: {
                            message.z = reader.float();
                            break;
                        }
                    case 4: {
                            message.w = reader.float();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Quaternion message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof bayesmech.vision.Quaternion
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {bayesmech.vision.Quaternion} Quaternion
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Quaternion.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Quaternion message.
             * @function verify
             * @memberof bayesmech.vision.Quaternion
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Quaternion.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.x != null && message.hasOwnProperty("x"))
                    if (typeof message.x !== "number")
                        return "x: number expected";
                if (message.y != null && message.hasOwnProperty("y"))
                    if (typeof message.y !== "number")
                        return "y: number expected";
                if (message.z != null && message.hasOwnProperty("z"))
                    if (typeof message.z !== "number")
                        return "z: number expected";
                if (message.w != null && message.hasOwnProperty("w"))
                    if (typeof message.w !== "number")
                        return "w: number expected";
                return null;
            };

            /**
             * Creates a Quaternion message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof bayesmech.vision.Quaternion
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {bayesmech.vision.Quaternion} Quaternion
             */
            Quaternion.fromObject = function fromObject(object) {
                if (object instanceof $root.bayesmech.vision.Quaternion)
                    return object;
                let message = new $root.bayesmech.vision.Quaternion();
                if (object.x != null)
                    message.x = Number(object.x);
                if (object.y != null)
                    message.y = Number(object.y);
                if (object.z != null)
                    message.z = Number(object.z);
                if (object.w != null)
                    message.w = Number(object.w);
                return message;
            };

            /**
             * Creates a plain object from a Quaternion message. Also converts values to other types if specified.
             * @function toObject
             * @memberof bayesmech.vision.Quaternion
             * @static
             * @param {bayesmech.vision.Quaternion} message Quaternion
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Quaternion.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.x = 0;
                    object.y = 0;
                    object.z = 0;
                    object.w = 0;
                }
                if (message.x != null && message.hasOwnProperty("x"))
                    object.x = options.json && !isFinite(message.x) ? String(message.x) : message.x;
                if (message.y != null && message.hasOwnProperty("y"))
                    object.y = options.json && !isFinite(message.y) ? String(message.y) : message.y;
                if (message.z != null && message.hasOwnProperty("z"))
                    object.z = options.json && !isFinite(message.z) ? String(message.z) : message.z;
                if (message.w != null && message.hasOwnProperty("w"))
                    object.w = options.json && !isFinite(message.w) ? String(message.w) : message.w;
                return object;
            };

            /**
             * Converts this Quaternion to JSON.
             * @function toJSON
             * @memberof bayesmech.vision.Quaternion
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Quaternion.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Quaternion
             * @function getTypeUrl
             * @memberof bayesmech.vision.Quaternion
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Quaternion.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/bayesmech.vision.Quaternion";
            };

            return Quaternion;
        })();

        vision.InferredGeometry = (function() {

            /**
             * Properties of an InferredGeometry.
             * @memberof bayesmech.vision
             * @interface IInferredGeometry
             * @property {Array.<bayesmech.vision.InferredGeometry.IPlane>|null} [planes] InferredGeometry planes
             * @property {Array.<bayesmech.vision.InferredGeometry.ITrackedPoint>|null} [pointCloud] InferredGeometry pointCloud
             */

            /**
             * Constructs a new InferredGeometry.
             * @memberof bayesmech.vision
             * @classdesc Represents an InferredGeometry.
             * @implements IInferredGeometry
             * @constructor
             * @param {bayesmech.vision.IInferredGeometry=} [properties] Properties to set
             */
            function InferredGeometry(properties) {
                this.planes = [];
                this.pointCloud = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * InferredGeometry planes.
             * @member {Array.<bayesmech.vision.InferredGeometry.IPlane>} planes
             * @memberof bayesmech.vision.InferredGeometry
             * @instance
             */
            InferredGeometry.prototype.planes = $util.emptyArray;

            /**
             * InferredGeometry pointCloud.
             * @member {Array.<bayesmech.vision.InferredGeometry.ITrackedPoint>} pointCloud
             * @memberof bayesmech.vision.InferredGeometry
             * @instance
             */
            InferredGeometry.prototype.pointCloud = $util.emptyArray;

            /**
             * Creates a new InferredGeometry instance using the specified properties.
             * @function create
             * @memberof bayesmech.vision.InferredGeometry
             * @static
             * @param {bayesmech.vision.IInferredGeometry=} [properties] Properties to set
             * @returns {bayesmech.vision.InferredGeometry} InferredGeometry instance
             */
            InferredGeometry.create = function create(properties) {
                return new InferredGeometry(properties);
            };

            /**
             * Encodes the specified InferredGeometry message. Does not implicitly {@link bayesmech.vision.InferredGeometry.verify|verify} messages.
             * @function encode
             * @memberof bayesmech.vision.InferredGeometry
             * @static
             * @param {bayesmech.vision.IInferredGeometry} message InferredGeometry message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InferredGeometry.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.planes != null && message.planes.length)
                    for (let i = 0; i < message.planes.length; ++i)
                        $root.bayesmech.vision.InferredGeometry.Plane.encode(message.planes[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.pointCloud != null && message.pointCloud.length)
                    for (let i = 0; i < message.pointCloud.length; ++i)
                        $root.bayesmech.vision.InferredGeometry.TrackedPoint.encode(message.pointCloud[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified InferredGeometry message, length delimited. Does not implicitly {@link bayesmech.vision.InferredGeometry.verify|verify} messages.
             * @function encodeDelimited
             * @memberof bayesmech.vision.InferredGeometry
             * @static
             * @param {bayesmech.vision.IInferredGeometry} message InferredGeometry message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InferredGeometry.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an InferredGeometry message from the specified reader or buffer.
             * @function decode
             * @memberof bayesmech.vision.InferredGeometry
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {bayesmech.vision.InferredGeometry} InferredGeometry
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InferredGeometry.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.bayesmech.vision.InferredGeometry();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            if (!(message.planes && message.planes.length))
                                message.planes = [];
                            message.planes.push($root.bayesmech.vision.InferredGeometry.Plane.decode(reader, reader.uint32()));
                            break;
                        }
                    case 2: {
                            if (!(message.pointCloud && message.pointCloud.length))
                                message.pointCloud = [];
                            message.pointCloud.push($root.bayesmech.vision.InferredGeometry.TrackedPoint.decode(reader, reader.uint32()));
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an InferredGeometry message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof bayesmech.vision.InferredGeometry
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {bayesmech.vision.InferredGeometry} InferredGeometry
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InferredGeometry.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an InferredGeometry message.
             * @function verify
             * @memberof bayesmech.vision.InferredGeometry
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            InferredGeometry.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.planes != null && message.hasOwnProperty("planes")) {
                    if (!Array.isArray(message.planes))
                        return "planes: array expected";
                    for (let i = 0; i < message.planes.length; ++i) {
                        let error = $root.bayesmech.vision.InferredGeometry.Plane.verify(message.planes[i]);
                        if (error)
                            return "planes." + error;
                    }
                }
                if (message.pointCloud != null && message.hasOwnProperty("pointCloud")) {
                    if (!Array.isArray(message.pointCloud))
                        return "pointCloud: array expected";
                    for (let i = 0; i < message.pointCloud.length; ++i) {
                        let error = $root.bayesmech.vision.InferredGeometry.TrackedPoint.verify(message.pointCloud[i]);
                        if (error)
                            return "pointCloud." + error;
                    }
                }
                return null;
            };

            /**
             * Creates an InferredGeometry message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof bayesmech.vision.InferredGeometry
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {bayesmech.vision.InferredGeometry} InferredGeometry
             */
            InferredGeometry.fromObject = function fromObject(object) {
                if (object instanceof $root.bayesmech.vision.InferredGeometry)
                    return object;
                let message = new $root.bayesmech.vision.InferredGeometry();
                if (object.planes) {
                    if (!Array.isArray(object.planes))
                        throw TypeError(".bayesmech.vision.InferredGeometry.planes: array expected");
                    message.planes = [];
                    for (let i = 0; i < object.planes.length; ++i) {
                        if (typeof object.planes[i] !== "object")
                            throw TypeError(".bayesmech.vision.InferredGeometry.planes: object expected");
                        message.planes[i] = $root.bayesmech.vision.InferredGeometry.Plane.fromObject(object.planes[i]);
                    }
                }
                if (object.pointCloud) {
                    if (!Array.isArray(object.pointCloud))
                        throw TypeError(".bayesmech.vision.InferredGeometry.pointCloud: array expected");
                    message.pointCloud = [];
                    for (let i = 0; i < object.pointCloud.length; ++i) {
                        if (typeof object.pointCloud[i] !== "object")
                            throw TypeError(".bayesmech.vision.InferredGeometry.pointCloud: object expected");
                        message.pointCloud[i] = $root.bayesmech.vision.InferredGeometry.TrackedPoint.fromObject(object.pointCloud[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from an InferredGeometry message. Also converts values to other types if specified.
             * @function toObject
             * @memberof bayesmech.vision.InferredGeometry
             * @static
             * @param {bayesmech.vision.InferredGeometry} message InferredGeometry
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            InferredGeometry.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults) {
                    object.planes = [];
                    object.pointCloud = [];
                }
                if (message.planes && message.planes.length) {
                    object.planes = [];
                    for (let j = 0; j < message.planes.length; ++j)
                        object.planes[j] = $root.bayesmech.vision.InferredGeometry.Plane.toObject(message.planes[j], options);
                }
                if (message.pointCloud && message.pointCloud.length) {
                    object.pointCloud = [];
                    for (let j = 0; j < message.pointCloud.length; ++j)
                        object.pointCloud[j] = $root.bayesmech.vision.InferredGeometry.TrackedPoint.toObject(message.pointCloud[j], options);
                }
                return object;
            };

            /**
             * Converts this InferredGeometry to JSON.
             * @function toJSON
             * @memberof bayesmech.vision.InferredGeometry
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            InferredGeometry.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for InferredGeometry
             * @function getTypeUrl
             * @memberof bayesmech.vision.InferredGeometry
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            InferredGeometry.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/bayesmech.vision.InferredGeometry";
            };

            InferredGeometry.Plane = (function() {

                /**
                 * Properties of a Plane.
                 * @memberof bayesmech.vision.InferredGeometry
                 * @interface IPlane
                 * @property {Uint8Array|null} [id] Plane id
                 * @property {bayesmech.vision.IPose|null} [centerPose] Plane centerPose
                 * @property {number|null} [extentX] Plane extentX
                 * @property {number|null} [extentZ] Plane extentZ
                 * @property {bayesmech.vision.InferredGeometry.Plane.PlaneType|null} [type] Plane type
                 * @property {Array.<bayesmech.vision.IVector3>|null} [polygon] Plane polygon
                 */

                /**
                 * Constructs a new Plane.
                 * @memberof bayesmech.vision.InferredGeometry
                 * @classdesc Represents a Plane.
                 * @implements IPlane
                 * @constructor
                 * @param {bayesmech.vision.InferredGeometry.IPlane=} [properties] Properties to set
                 */
                function Plane(properties) {
                    this.polygon = [];
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Plane id.
                 * @member {Uint8Array} id
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @instance
                 */
                Plane.prototype.id = $util.newBuffer([]);

                /**
                 * Plane centerPose.
                 * @member {bayesmech.vision.IPose|null|undefined} centerPose
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @instance
                 */
                Plane.prototype.centerPose = null;

                /**
                 * Plane extentX.
                 * @member {number} extentX
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @instance
                 */
                Plane.prototype.extentX = 0;

                /**
                 * Plane extentZ.
                 * @member {number} extentZ
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @instance
                 */
                Plane.prototype.extentZ = 0;

                /**
                 * Plane type.
                 * @member {bayesmech.vision.InferredGeometry.Plane.PlaneType} type
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @instance
                 */
                Plane.prototype.type = 0;

                /**
                 * Plane polygon.
                 * @member {Array.<bayesmech.vision.IVector3>} polygon
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @instance
                 */
                Plane.prototype.polygon = $util.emptyArray;

                /**
                 * Creates a new Plane instance using the specified properties.
                 * @function create
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @static
                 * @param {bayesmech.vision.InferredGeometry.IPlane=} [properties] Properties to set
                 * @returns {bayesmech.vision.InferredGeometry.Plane} Plane instance
                 */
                Plane.create = function create(properties) {
                    return new Plane(properties);
                };

                /**
                 * Encodes the specified Plane message. Does not implicitly {@link bayesmech.vision.InferredGeometry.Plane.verify|verify} messages.
                 * @function encode
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @static
                 * @param {bayesmech.vision.InferredGeometry.IPlane} message Plane message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Plane.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                        writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.id);
                    if (message.centerPose != null && Object.hasOwnProperty.call(message, "centerPose"))
                        $root.bayesmech.vision.Pose.encode(message.centerPose, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                    if (message.extentX != null && Object.hasOwnProperty.call(message, "extentX"))
                        writer.uint32(/* id 3, wireType 5 =*/29).float(message.extentX);
                    if (message.extentZ != null && Object.hasOwnProperty.call(message, "extentZ"))
                        writer.uint32(/* id 4, wireType 5 =*/37).float(message.extentZ);
                    if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                        writer.uint32(/* id 5, wireType 0 =*/40).int32(message.type);
                    if (message.polygon != null && message.polygon.length)
                        for (let i = 0; i < message.polygon.length; ++i)
                            $root.bayesmech.vision.Vector3.encode(message.polygon[i], writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                    return writer;
                };

                /**
                 * Encodes the specified Plane message, length delimited. Does not implicitly {@link bayesmech.vision.InferredGeometry.Plane.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @static
                 * @param {bayesmech.vision.InferredGeometry.IPlane} message Plane message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Plane.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a Plane message from the specified reader or buffer.
                 * @function decode
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {bayesmech.vision.InferredGeometry.Plane} Plane
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Plane.decode = function decode(reader, length, error) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.bayesmech.vision.InferredGeometry.Plane();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        if (tag === error)
                            break;
                        switch (tag >>> 3) {
                        case 1: {
                                message.id = reader.bytes();
                                break;
                            }
                        case 2: {
                                message.centerPose = $root.bayesmech.vision.Pose.decode(reader, reader.uint32());
                                break;
                            }
                        case 3: {
                                message.extentX = reader.float();
                                break;
                            }
                        case 4: {
                                message.extentZ = reader.float();
                                break;
                            }
                        case 5: {
                                message.type = reader.int32();
                                break;
                            }
                        case 6: {
                                if (!(message.polygon && message.polygon.length))
                                    message.polygon = [];
                                message.polygon.push($root.bayesmech.vision.Vector3.decode(reader, reader.uint32()));
                                break;
                            }
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a Plane message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {bayesmech.vision.InferredGeometry.Plane} Plane
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Plane.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a Plane message.
                 * @function verify
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                Plane.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.id != null && message.hasOwnProperty("id"))
                        if (!(message.id && typeof message.id.length === "number" || $util.isString(message.id)))
                            return "id: buffer expected";
                    if (message.centerPose != null && message.hasOwnProperty("centerPose")) {
                        let error = $root.bayesmech.vision.Pose.verify(message.centerPose);
                        if (error)
                            return "centerPose." + error;
                    }
                    if (message.extentX != null && message.hasOwnProperty("extentX"))
                        if (typeof message.extentX !== "number")
                            return "extentX: number expected";
                    if (message.extentZ != null && message.hasOwnProperty("extentZ"))
                        if (typeof message.extentZ !== "number")
                            return "extentZ: number expected";
                    if (message.type != null && message.hasOwnProperty("type"))
                        switch (message.type) {
                        default:
                            return "type: enum value expected";
                        case 0:
                        case 1:
                        case 2:
                        case 3:
                            break;
                        }
                    if (message.polygon != null && message.hasOwnProperty("polygon")) {
                        if (!Array.isArray(message.polygon))
                            return "polygon: array expected";
                        for (let i = 0; i < message.polygon.length; ++i) {
                            let error = $root.bayesmech.vision.Vector3.verify(message.polygon[i]);
                            if (error)
                                return "polygon." + error;
                        }
                    }
                    return null;
                };

                /**
                 * Creates a Plane message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {bayesmech.vision.InferredGeometry.Plane} Plane
                 */
                Plane.fromObject = function fromObject(object) {
                    if (object instanceof $root.bayesmech.vision.InferredGeometry.Plane)
                        return object;
                    let message = new $root.bayesmech.vision.InferredGeometry.Plane();
                    if (object.id != null)
                        if (typeof object.id === "string")
                            $util.base64.decode(object.id, message.id = $util.newBuffer($util.base64.length(object.id)), 0);
                        else if (object.id.length >= 0)
                            message.id = object.id;
                    if (object.centerPose != null) {
                        if (typeof object.centerPose !== "object")
                            throw TypeError(".bayesmech.vision.InferredGeometry.Plane.centerPose: object expected");
                        message.centerPose = $root.bayesmech.vision.Pose.fromObject(object.centerPose);
                    }
                    if (object.extentX != null)
                        message.extentX = Number(object.extentX);
                    if (object.extentZ != null)
                        message.extentZ = Number(object.extentZ);
                    switch (object.type) {
                    default:
                        if (typeof object.type === "number") {
                            message.type = object.type;
                            break;
                        }
                        break;
                    case "PLANE_TYPE_UNKNOWN":
                    case 0:
                        message.type = 0;
                        break;
                    case "HORIZONTAL_UPWARD_FACING":
                    case 1:
                        message.type = 1;
                        break;
                    case "HORIZONTAL_DOWNWARD_FACING":
                    case 2:
                        message.type = 2;
                        break;
                    case "VERTICAL":
                    case 3:
                        message.type = 3;
                        break;
                    }
                    if (object.polygon) {
                        if (!Array.isArray(object.polygon))
                            throw TypeError(".bayesmech.vision.InferredGeometry.Plane.polygon: array expected");
                        message.polygon = [];
                        for (let i = 0; i < object.polygon.length; ++i) {
                            if (typeof object.polygon[i] !== "object")
                                throw TypeError(".bayesmech.vision.InferredGeometry.Plane.polygon: object expected");
                            message.polygon[i] = $root.bayesmech.vision.Vector3.fromObject(object.polygon[i]);
                        }
                    }
                    return message;
                };

                /**
                 * Creates a plain object from a Plane message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @static
                 * @param {bayesmech.vision.InferredGeometry.Plane} message Plane
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Plane.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.arrays || options.defaults)
                        object.polygon = [];
                    if (options.defaults) {
                        if (options.bytes === String)
                            object.id = "";
                        else {
                            object.id = [];
                            if (options.bytes !== Array)
                                object.id = $util.newBuffer(object.id);
                        }
                        object.centerPose = null;
                        object.extentX = 0;
                        object.extentZ = 0;
                        object.type = options.enums === String ? "PLANE_TYPE_UNKNOWN" : 0;
                    }
                    if (message.id != null && message.hasOwnProperty("id"))
                        object.id = options.bytes === String ? $util.base64.encode(message.id, 0, message.id.length) : options.bytes === Array ? Array.prototype.slice.call(message.id) : message.id;
                    if (message.centerPose != null && message.hasOwnProperty("centerPose"))
                        object.centerPose = $root.bayesmech.vision.Pose.toObject(message.centerPose, options);
                    if (message.extentX != null && message.hasOwnProperty("extentX"))
                        object.extentX = options.json && !isFinite(message.extentX) ? String(message.extentX) : message.extentX;
                    if (message.extentZ != null && message.hasOwnProperty("extentZ"))
                        object.extentZ = options.json && !isFinite(message.extentZ) ? String(message.extentZ) : message.extentZ;
                    if (message.type != null && message.hasOwnProperty("type"))
                        object.type = options.enums === String ? $root.bayesmech.vision.InferredGeometry.Plane.PlaneType[message.type] === undefined ? message.type : $root.bayesmech.vision.InferredGeometry.Plane.PlaneType[message.type] : message.type;
                    if (message.polygon && message.polygon.length) {
                        object.polygon = [];
                        for (let j = 0; j < message.polygon.length; ++j)
                            object.polygon[j] = $root.bayesmech.vision.Vector3.toObject(message.polygon[j], options);
                    }
                    return object;
                };

                /**
                 * Converts this Plane to JSON.
                 * @function toJSON
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Plane.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for Plane
                 * @function getTypeUrl
                 * @memberof bayesmech.vision.InferredGeometry.Plane
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Plane.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/bayesmech.vision.InferredGeometry.Plane";
                };

                /**
                 * PlaneType enum.
                 * @name bayesmech.vision.InferredGeometry.Plane.PlaneType
                 * @enum {number}
                 * @property {number} PLANE_TYPE_UNKNOWN=0 PLANE_TYPE_UNKNOWN value
                 * @property {number} HORIZONTAL_UPWARD_FACING=1 HORIZONTAL_UPWARD_FACING value
                 * @property {number} HORIZONTAL_DOWNWARD_FACING=2 HORIZONTAL_DOWNWARD_FACING value
                 * @property {number} VERTICAL=3 VERTICAL value
                 */
                Plane.PlaneType = (function() {
                    const valuesById = {}, values = Object.create(valuesById);
                    values[valuesById[0] = "PLANE_TYPE_UNKNOWN"] = 0;
                    values[valuesById[1] = "HORIZONTAL_UPWARD_FACING"] = 1;
                    values[valuesById[2] = "HORIZONTAL_DOWNWARD_FACING"] = 2;
                    values[valuesById[3] = "VERTICAL"] = 3;
                    return values;
                })();

                return Plane;
            })();

            InferredGeometry.TrackedPoint = (function() {

                /**
                 * Properties of a TrackedPoint.
                 * @memberof bayesmech.vision.InferredGeometry
                 * @interface ITrackedPoint
                 * @property {bayesmech.vision.IVector3|null} [point] TrackedPoint point
                 * @property {number|null} [confidence] TrackedPoint confidence
                 */

                /**
                 * Constructs a new TrackedPoint.
                 * @memberof bayesmech.vision.InferredGeometry
                 * @classdesc Represents a TrackedPoint.
                 * @implements ITrackedPoint
                 * @constructor
                 * @param {bayesmech.vision.InferredGeometry.ITrackedPoint=} [properties] Properties to set
                 */
                function TrackedPoint(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * TrackedPoint point.
                 * @member {bayesmech.vision.IVector3|null|undefined} point
                 * @memberof bayesmech.vision.InferredGeometry.TrackedPoint
                 * @instance
                 */
                TrackedPoint.prototype.point = null;

                /**
                 * TrackedPoint confidence.
                 * @member {number} confidence
                 * @memberof bayesmech.vision.InferredGeometry.TrackedPoint
                 * @instance
                 */
                TrackedPoint.prototype.confidence = 0;

                /**
                 * Creates a new TrackedPoint instance using the specified properties.
                 * @function create
                 * @memberof bayesmech.vision.InferredGeometry.TrackedPoint
                 * @static
                 * @param {bayesmech.vision.InferredGeometry.ITrackedPoint=} [properties] Properties to set
                 * @returns {bayesmech.vision.InferredGeometry.TrackedPoint} TrackedPoint instance
                 */
                TrackedPoint.create = function create(properties) {
                    return new TrackedPoint(properties);
                };

                /**
                 * Encodes the specified TrackedPoint message. Does not implicitly {@link bayesmech.vision.InferredGeometry.TrackedPoint.verify|verify} messages.
                 * @function encode
                 * @memberof bayesmech.vision.InferredGeometry.TrackedPoint
                 * @static
                 * @param {bayesmech.vision.InferredGeometry.ITrackedPoint} message TrackedPoint message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                TrackedPoint.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.point != null && Object.hasOwnProperty.call(message, "point"))
                        $root.bayesmech.vision.Vector3.encode(message.point, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                    if (message.confidence != null && Object.hasOwnProperty.call(message, "confidence"))
                        writer.uint32(/* id 2, wireType 5 =*/21).float(message.confidence);
                    return writer;
                };

                /**
                 * Encodes the specified TrackedPoint message, length delimited. Does not implicitly {@link bayesmech.vision.InferredGeometry.TrackedPoint.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof bayesmech.vision.InferredGeometry.TrackedPoint
                 * @static
                 * @param {bayesmech.vision.InferredGeometry.ITrackedPoint} message TrackedPoint message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                TrackedPoint.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a TrackedPoint message from the specified reader or buffer.
                 * @function decode
                 * @memberof bayesmech.vision.InferredGeometry.TrackedPoint
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {bayesmech.vision.InferredGeometry.TrackedPoint} TrackedPoint
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                TrackedPoint.decode = function decode(reader, length, error) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.bayesmech.vision.InferredGeometry.TrackedPoint();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        if (tag === error)
                            break;
                        switch (tag >>> 3) {
                        case 1: {
                                message.point = $root.bayesmech.vision.Vector3.decode(reader, reader.uint32());
                                break;
                            }
                        case 2: {
                                message.confidence = reader.float();
                                break;
                            }
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a TrackedPoint message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof bayesmech.vision.InferredGeometry.TrackedPoint
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {bayesmech.vision.InferredGeometry.TrackedPoint} TrackedPoint
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                TrackedPoint.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a TrackedPoint message.
                 * @function verify
                 * @memberof bayesmech.vision.InferredGeometry.TrackedPoint
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                TrackedPoint.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.point != null && message.hasOwnProperty("point")) {
                        let error = $root.bayesmech.vision.Vector3.verify(message.point);
                        if (error)
                            return "point." + error;
                    }
                    if (message.confidence != null && message.hasOwnProperty("confidence"))
                        if (typeof message.confidence !== "number")
                            return "confidence: number expected";
                    return null;
                };

                /**
                 * Creates a TrackedPoint message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof bayesmech.vision.InferredGeometry.TrackedPoint
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {bayesmech.vision.InferredGeometry.TrackedPoint} TrackedPoint
                 */
                TrackedPoint.fromObject = function fromObject(object) {
                    if (object instanceof $root.bayesmech.vision.InferredGeometry.TrackedPoint)
                        return object;
                    let message = new $root.bayesmech.vision.InferredGeometry.TrackedPoint();
                    if (object.point != null) {
                        if (typeof object.point !== "object")
                            throw TypeError(".bayesmech.vision.InferredGeometry.TrackedPoint.point: object expected");
                        message.point = $root.bayesmech.vision.Vector3.fromObject(object.point);
                    }
                    if (object.confidence != null)
                        message.confidence = Number(object.confidence);
                    return message;
                };

                /**
                 * Creates a plain object from a TrackedPoint message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof bayesmech.vision.InferredGeometry.TrackedPoint
                 * @static
                 * @param {bayesmech.vision.InferredGeometry.TrackedPoint} message TrackedPoint
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                TrackedPoint.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.defaults) {
                        object.point = null;
                        object.confidence = 0;
                    }
                    if (message.point != null && message.hasOwnProperty("point"))
                        object.point = $root.bayesmech.vision.Vector3.toObject(message.point, options);
                    if (message.confidence != null && message.hasOwnProperty("confidence"))
                        object.confidence = options.json && !isFinite(message.confidence) ? String(message.confidence) : message.confidence;
                    return object;
                };

                /**
                 * Converts this TrackedPoint to JSON.
                 * @function toJSON
                 * @memberof bayesmech.vision.InferredGeometry.TrackedPoint
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                TrackedPoint.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for TrackedPoint
                 * @function getTypeUrl
                 * @memberof bayesmech.vision.InferredGeometry.TrackedPoint
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                TrackedPoint.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/bayesmech.vision.InferredGeometry.TrackedPoint";
                };

                return TrackedPoint;
            })();

            return InferredGeometry;
        })();

        vision.PerceiverDataFrame = (function() {

            /**
             * Properties of a PerceiverDataFrame.
             * @memberof bayesmech.vision
             * @interface IPerceiverDataFrame
             * @property {bayesmech.vision.IPerceiverFrameIdentifier|null} [frameIdentifier] PerceiverDataFrame frameIdentifier
             * @property {bayesmech.vision.IPose|null} [cameraPose] PerceiverDataFrame cameraPose
             * @property {bayesmech.vision.IImageFrame|null} [rgbFrame] PerceiverDataFrame rgbFrame
             * @property {bayesmech.vision.IDepthFrame|null} [depthFrame] PerceiverDataFrame depthFrame
             * @property {bayesmech.vision.IImuData|null} [imuData] PerceiverDataFrame imuData
             * @property {bayesmech.vision.ICameraIntrinsics|null} [cameraIntrinsics] PerceiverDataFrame cameraIntrinsics
             * @property {bayesmech.vision.IInferredGeometry|null} [inferredGeometry] PerceiverDataFrame inferredGeometry
             */

            /**
             * Constructs a new PerceiverDataFrame.
             * @memberof bayesmech.vision
             * @classdesc Represents a PerceiverDataFrame.
             * @implements IPerceiverDataFrame
             * @constructor
             * @param {bayesmech.vision.IPerceiverDataFrame=} [properties] Properties to set
             */
            function PerceiverDataFrame(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * PerceiverDataFrame frameIdentifier.
             * @member {bayesmech.vision.IPerceiverFrameIdentifier|null|undefined} frameIdentifier
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @instance
             */
            PerceiverDataFrame.prototype.frameIdentifier = null;

            /**
             * PerceiverDataFrame cameraPose.
             * @member {bayesmech.vision.IPose|null|undefined} cameraPose
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @instance
             */
            PerceiverDataFrame.prototype.cameraPose = null;

            /**
             * PerceiverDataFrame rgbFrame.
             * @member {bayesmech.vision.IImageFrame|null|undefined} rgbFrame
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @instance
             */
            PerceiverDataFrame.prototype.rgbFrame = null;

            /**
             * PerceiverDataFrame depthFrame.
             * @member {bayesmech.vision.IDepthFrame|null|undefined} depthFrame
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @instance
             */
            PerceiverDataFrame.prototype.depthFrame = null;

            /**
             * PerceiverDataFrame imuData.
             * @member {bayesmech.vision.IImuData|null|undefined} imuData
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @instance
             */
            PerceiverDataFrame.prototype.imuData = null;

            /**
             * PerceiverDataFrame cameraIntrinsics.
             * @member {bayesmech.vision.ICameraIntrinsics|null|undefined} cameraIntrinsics
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @instance
             */
            PerceiverDataFrame.prototype.cameraIntrinsics = null;

            /**
             * PerceiverDataFrame inferredGeometry.
             * @member {bayesmech.vision.IInferredGeometry|null|undefined} inferredGeometry
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @instance
             */
            PerceiverDataFrame.prototype.inferredGeometry = null;

            /**
             * Creates a new PerceiverDataFrame instance using the specified properties.
             * @function create
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @static
             * @param {bayesmech.vision.IPerceiverDataFrame=} [properties] Properties to set
             * @returns {bayesmech.vision.PerceiverDataFrame} PerceiverDataFrame instance
             */
            PerceiverDataFrame.create = function create(properties) {
                return new PerceiverDataFrame(properties);
            };

            /**
             * Encodes the specified PerceiverDataFrame message. Does not implicitly {@link bayesmech.vision.PerceiverDataFrame.verify|verify} messages.
             * @function encode
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @static
             * @param {bayesmech.vision.IPerceiverDataFrame} message PerceiverDataFrame message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PerceiverDataFrame.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.frameIdentifier != null && Object.hasOwnProperty.call(message, "frameIdentifier"))
                    $root.bayesmech.vision.PerceiverFrameIdentifier.encode(message.frameIdentifier, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.cameraPose != null && Object.hasOwnProperty.call(message, "cameraPose"))
                    $root.bayesmech.vision.Pose.encode(message.cameraPose, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.rgbFrame != null && Object.hasOwnProperty.call(message, "rgbFrame"))
                    $root.bayesmech.vision.ImageFrame.encode(message.rgbFrame, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                if (message.depthFrame != null && Object.hasOwnProperty.call(message, "depthFrame"))
                    $root.bayesmech.vision.DepthFrame.encode(message.depthFrame, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                if (message.imuData != null && Object.hasOwnProperty.call(message, "imuData"))
                    $root.bayesmech.vision.ImuData.encode(message.imuData, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                if (message.cameraIntrinsics != null && Object.hasOwnProperty.call(message, "cameraIntrinsics"))
                    $root.bayesmech.vision.CameraIntrinsics.encode(message.cameraIntrinsics, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                if (message.inferredGeometry != null && Object.hasOwnProperty.call(message, "inferredGeometry"))
                    $root.bayesmech.vision.InferredGeometry.encode(message.inferredGeometry, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified PerceiverDataFrame message, length delimited. Does not implicitly {@link bayesmech.vision.PerceiverDataFrame.verify|verify} messages.
             * @function encodeDelimited
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @static
             * @param {bayesmech.vision.IPerceiverDataFrame} message PerceiverDataFrame message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PerceiverDataFrame.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a PerceiverDataFrame message from the specified reader or buffer.
             * @function decode
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {bayesmech.vision.PerceiverDataFrame} PerceiverDataFrame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PerceiverDataFrame.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.bayesmech.vision.PerceiverDataFrame();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.frameIdentifier = $root.bayesmech.vision.PerceiverFrameIdentifier.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.cameraPose = $root.bayesmech.vision.Pose.decode(reader, reader.uint32());
                            break;
                        }
                    case 3: {
                            message.rgbFrame = $root.bayesmech.vision.ImageFrame.decode(reader, reader.uint32());
                            break;
                        }
                    case 4: {
                            message.depthFrame = $root.bayesmech.vision.DepthFrame.decode(reader, reader.uint32());
                            break;
                        }
                    case 5: {
                            message.imuData = $root.bayesmech.vision.ImuData.decode(reader, reader.uint32());
                            break;
                        }
                    case 6: {
                            message.cameraIntrinsics = $root.bayesmech.vision.CameraIntrinsics.decode(reader, reader.uint32());
                            break;
                        }
                    case 7: {
                            message.inferredGeometry = $root.bayesmech.vision.InferredGeometry.decode(reader, reader.uint32());
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a PerceiverDataFrame message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {bayesmech.vision.PerceiverDataFrame} PerceiverDataFrame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PerceiverDataFrame.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a PerceiverDataFrame message.
             * @function verify
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            PerceiverDataFrame.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.frameIdentifier != null && message.hasOwnProperty("frameIdentifier")) {
                    let error = $root.bayesmech.vision.PerceiverFrameIdentifier.verify(message.frameIdentifier);
                    if (error)
                        return "frameIdentifier." + error;
                }
                if (message.cameraPose != null && message.hasOwnProperty("cameraPose")) {
                    let error = $root.bayesmech.vision.Pose.verify(message.cameraPose);
                    if (error)
                        return "cameraPose." + error;
                }
                if (message.rgbFrame != null && message.hasOwnProperty("rgbFrame")) {
                    let error = $root.bayesmech.vision.ImageFrame.verify(message.rgbFrame);
                    if (error)
                        return "rgbFrame." + error;
                }
                if (message.depthFrame != null && message.hasOwnProperty("depthFrame")) {
                    let error = $root.bayesmech.vision.DepthFrame.verify(message.depthFrame);
                    if (error)
                        return "depthFrame." + error;
                }
                if (message.imuData != null && message.hasOwnProperty("imuData")) {
                    let error = $root.bayesmech.vision.ImuData.verify(message.imuData);
                    if (error)
                        return "imuData." + error;
                }
                if (message.cameraIntrinsics != null && message.hasOwnProperty("cameraIntrinsics")) {
                    let error = $root.bayesmech.vision.CameraIntrinsics.verify(message.cameraIntrinsics);
                    if (error)
                        return "cameraIntrinsics." + error;
                }
                if (message.inferredGeometry != null && message.hasOwnProperty("inferredGeometry")) {
                    let error = $root.bayesmech.vision.InferredGeometry.verify(message.inferredGeometry);
                    if (error)
                        return "inferredGeometry." + error;
                }
                return null;
            };

            /**
             * Creates a PerceiverDataFrame message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {bayesmech.vision.PerceiverDataFrame} PerceiverDataFrame
             */
            PerceiverDataFrame.fromObject = function fromObject(object) {
                if (object instanceof $root.bayesmech.vision.PerceiverDataFrame)
                    return object;
                let message = new $root.bayesmech.vision.PerceiverDataFrame();
                if (object.frameIdentifier != null) {
                    if (typeof object.frameIdentifier !== "object")
                        throw TypeError(".bayesmech.vision.PerceiverDataFrame.frameIdentifier: object expected");
                    message.frameIdentifier = $root.bayesmech.vision.PerceiverFrameIdentifier.fromObject(object.frameIdentifier);
                }
                if (object.cameraPose != null) {
                    if (typeof object.cameraPose !== "object")
                        throw TypeError(".bayesmech.vision.PerceiverDataFrame.cameraPose: object expected");
                    message.cameraPose = $root.bayesmech.vision.Pose.fromObject(object.cameraPose);
                }
                if (object.rgbFrame != null) {
                    if (typeof object.rgbFrame !== "object")
                        throw TypeError(".bayesmech.vision.PerceiverDataFrame.rgbFrame: object expected");
                    message.rgbFrame = $root.bayesmech.vision.ImageFrame.fromObject(object.rgbFrame);
                }
                if (object.depthFrame != null) {
                    if (typeof object.depthFrame !== "object")
                        throw TypeError(".bayesmech.vision.PerceiverDataFrame.depthFrame: object expected");
                    message.depthFrame = $root.bayesmech.vision.DepthFrame.fromObject(object.depthFrame);
                }
                if (object.imuData != null) {
                    if (typeof object.imuData !== "object")
                        throw TypeError(".bayesmech.vision.PerceiverDataFrame.imuData: object expected");
                    message.imuData = $root.bayesmech.vision.ImuData.fromObject(object.imuData);
                }
                if (object.cameraIntrinsics != null) {
                    if (typeof object.cameraIntrinsics !== "object")
                        throw TypeError(".bayesmech.vision.PerceiverDataFrame.cameraIntrinsics: object expected");
                    message.cameraIntrinsics = $root.bayesmech.vision.CameraIntrinsics.fromObject(object.cameraIntrinsics);
                }
                if (object.inferredGeometry != null) {
                    if (typeof object.inferredGeometry !== "object")
                        throw TypeError(".bayesmech.vision.PerceiverDataFrame.inferredGeometry: object expected");
                    message.inferredGeometry = $root.bayesmech.vision.InferredGeometry.fromObject(object.inferredGeometry);
                }
                return message;
            };

            /**
             * Creates a plain object from a PerceiverDataFrame message. Also converts values to other types if specified.
             * @function toObject
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @static
             * @param {bayesmech.vision.PerceiverDataFrame} message PerceiverDataFrame
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            PerceiverDataFrame.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.frameIdentifier = null;
                    object.cameraPose = null;
                    object.rgbFrame = null;
                    object.depthFrame = null;
                    object.imuData = null;
                    object.cameraIntrinsics = null;
                    object.inferredGeometry = null;
                }
                if (message.frameIdentifier != null && message.hasOwnProperty("frameIdentifier"))
                    object.frameIdentifier = $root.bayesmech.vision.PerceiverFrameIdentifier.toObject(message.frameIdentifier, options);
                if (message.cameraPose != null && message.hasOwnProperty("cameraPose"))
                    object.cameraPose = $root.bayesmech.vision.Pose.toObject(message.cameraPose, options);
                if (message.rgbFrame != null && message.hasOwnProperty("rgbFrame"))
                    object.rgbFrame = $root.bayesmech.vision.ImageFrame.toObject(message.rgbFrame, options);
                if (message.depthFrame != null && message.hasOwnProperty("depthFrame"))
                    object.depthFrame = $root.bayesmech.vision.DepthFrame.toObject(message.depthFrame, options);
                if (message.imuData != null && message.hasOwnProperty("imuData"))
                    object.imuData = $root.bayesmech.vision.ImuData.toObject(message.imuData, options);
                if (message.cameraIntrinsics != null && message.hasOwnProperty("cameraIntrinsics"))
                    object.cameraIntrinsics = $root.bayesmech.vision.CameraIntrinsics.toObject(message.cameraIntrinsics, options);
                if (message.inferredGeometry != null && message.hasOwnProperty("inferredGeometry"))
                    object.inferredGeometry = $root.bayesmech.vision.InferredGeometry.toObject(message.inferredGeometry, options);
                return object;
            };

            /**
             * Converts this PerceiverDataFrame to JSON.
             * @function toJSON
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            PerceiverDataFrame.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for PerceiverDataFrame
             * @function getTypeUrl
             * @memberof bayesmech.vision.PerceiverDataFrame
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            PerceiverDataFrame.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/bayesmech.vision.PerceiverDataFrame";
            };

            return PerceiverDataFrame;
        })();

        vision.PerceiverFrameIdentifier = (function() {

            /**
             * Properties of a PerceiverFrameIdentifier.
             * @memberof bayesmech.vision
             * @interface IPerceiverFrameIdentifier
             * @property {number|Long|null} [timestampNs] PerceiverFrameIdentifier timestampNs
             * @property {number|null} [frameNumber] PerceiverFrameIdentifier frameNumber
             * @property {string|null} [deviceId] PerceiverFrameIdentifier deviceId
             */

            /**
             * Constructs a new PerceiverFrameIdentifier.
             * @memberof bayesmech.vision
             * @classdesc Represents a PerceiverFrameIdentifier.
             * @implements IPerceiverFrameIdentifier
             * @constructor
             * @param {bayesmech.vision.IPerceiverFrameIdentifier=} [properties] Properties to set
             */
            function PerceiverFrameIdentifier(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * PerceiverFrameIdentifier timestampNs.
             * @member {number|Long} timestampNs
             * @memberof bayesmech.vision.PerceiverFrameIdentifier
             * @instance
             */
            PerceiverFrameIdentifier.prototype.timestampNs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * PerceiverFrameIdentifier frameNumber.
             * @member {number} frameNumber
             * @memberof bayesmech.vision.PerceiverFrameIdentifier
             * @instance
             */
            PerceiverFrameIdentifier.prototype.frameNumber = 0;

            /**
             * PerceiverFrameIdentifier deviceId.
             * @member {string} deviceId
             * @memberof bayesmech.vision.PerceiverFrameIdentifier
             * @instance
             */
            PerceiverFrameIdentifier.prototype.deviceId = "";

            /**
             * Creates a new PerceiverFrameIdentifier instance using the specified properties.
             * @function create
             * @memberof bayesmech.vision.PerceiverFrameIdentifier
             * @static
             * @param {bayesmech.vision.IPerceiverFrameIdentifier=} [properties] Properties to set
             * @returns {bayesmech.vision.PerceiverFrameIdentifier} PerceiverFrameIdentifier instance
             */
            PerceiverFrameIdentifier.create = function create(properties) {
                return new PerceiverFrameIdentifier(properties);
            };

            /**
             * Encodes the specified PerceiverFrameIdentifier message. Does not implicitly {@link bayesmech.vision.PerceiverFrameIdentifier.verify|verify} messages.
             * @function encode
             * @memberof bayesmech.vision.PerceiverFrameIdentifier
             * @static
             * @param {bayesmech.vision.IPerceiverFrameIdentifier} message PerceiverFrameIdentifier message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PerceiverFrameIdentifier.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.timestampNs != null && Object.hasOwnProperty.call(message, "timestampNs"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int64(message.timestampNs);
                if (message.frameNumber != null && Object.hasOwnProperty.call(message, "frameNumber"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.frameNumber);
                if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.deviceId);
                return writer;
            };

            /**
             * Encodes the specified PerceiverFrameIdentifier message, length delimited. Does not implicitly {@link bayesmech.vision.PerceiverFrameIdentifier.verify|verify} messages.
             * @function encodeDelimited
             * @memberof bayesmech.vision.PerceiverFrameIdentifier
             * @static
             * @param {bayesmech.vision.IPerceiverFrameIdentifier} message PerceiverFrameIdentifier message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PerceiverFrameIdentifier.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a PerceiverFrameIdentifier message from the specified reader or buffer.
             * @function decode
             * @memberof bayesmech.vision.PerceiverFrameIdentifier
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {bayesmech.vision.PerceiverFrameIdentifier} PerceiverFrameIdentifier
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PerceiverFrameIdentifier.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.bayesmech.vision.PerceiverFrameIdentifier();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.timestampNs = reader.int64();
                            break;
                        }
                    case 2: {
                            message.frameNumber = reader.uint32();
                            break;
                        }
                    case 3: {
                            message.deviceId = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a PerceiverFrameIdentifier message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof bayesmech.vision.PerceiverFrameIdentifier
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {bayesmech.vision.PerceiverFrameIdentifier} PerceiverFrameIdentifier
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PerceiverFrameIdentifier.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a PerceiverFrameIdentifier message.
             * @function verify
             * @memberof bayesmech.vision.PerceiverFrameIdentifier
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            PerceiverFrameIdentifier.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.timestampNs != null && message.hasOwnProperty("timestampNs"))
                    if (!$util.isInteger(message.timestampNs) && !(message.timestampNs && $util.isInteger(message.timestampNs.low) && $util.isInteger(message.timestampNs.high)))
                        return "timestampNs: integer|Long expected";
                if (message.frameNumber != null && message.hasOwnProperty("frameNumber"))
                    if (!$util.isInteger(message.frameNumber))
                        return "frameNumber: integer expected";
                if (message.deviceId != null && message.hasOwnProperty("deviceId"))
                    if (!$util.isString(message.deviceId))
                        return "deviceId: string expected";
                return null;
            };

            /**
             * Creates a PerceiverFrameIdentifier message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof bayesmech.vision.PerceiverFrameIdentifier
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {bayesmech.vision.PerceiverFrameIdentifier} PerceiverFrameIdentifier
             */
            PerceiverFrameIdentifier.fromObject = function fromObject(object) {
                if (object instanceof $root.bayesmech.vision.PerceiverFrameIdentifier)
                    return object;
                let message = new $root.bayesmech.vision.PerceiverFrameIdentifier();
                if (object.timestampNs != null)
                    if ($util.Long)
                        (message.timestampNs = $util.Long.fromValue(object.timestampNs)).unsigned = false;
                    else if (typeof object.timestampNs === "string")
                        message.timestampNs = parseInt(object.timestampNs, 10);
                    else if (typeof object.timestampNs === "number")
                        message.timestampNs = object.timestampNs;
                    else if (typeof object.timestampNs === "object")
                        message.timestampNs = new $util.LongBits(object.timestampNs.low >>> 0, object.timestampNs.high >>> 0).toNumber();
                if (object.frameNumber != null)
                    message.frameNumber = object.frameNumber >>> 0;
                if (object.deviceId != null)
                    message.deviceId = String(object.deviceId);
                return message;
            };

            /**
             * Creates a plain object from a PerceiverFrameIdentifier message. Also converts values to other types if specified.
             * @function toObject
             * @memberof bayesmech.vision.PerceiverFrameIdentifier
             * @static
             * @param {bayesmech.vision.PerceiverFrameIdentifier} message PerceiverFrameIdentifier
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            PerceiverFrameIdentifier.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.timestampNs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.timestampNs = options.longs === String ? "0" : 0;
                    object.frameNumber = 0;
                    object.deviceId = "";
                }
                if (message.timestampNs != null && message.hasOwnProperty("timestampNs"))
                    if (typeof message.timestampNs === "number")
                        object.timestampNs = options.longs === String ? String(message.timestampNs) : message.timestampNs;
                    else
                        object.timestampNs = options.longs === String ? $util.Long.prototype.toString.call(message.timestampNs) : options.longs === Number ? new $util.LongBits(message.timestampNs.low >>> 0, message.timestampNs.high >>> 0).toNumber() : message.timestampNs;
                if (message.frameNumber != null && message.hasOwnProperty("frameNumber"))
                    object.frameNumber = message.frameNumber;
                if (message.deviceId != null && message.hasOwnProperty("deviceId"))
                    object.deviceId = message.deviceId;
                return object;
            };

            /**
             * Converts this PerceiverFrameIdentifier to JSON.
             * @function toJSON
             * @memberof bayesmech.vision.PerceiverFrameIdentifier
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            PerceiverFrameIdentifier.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for PerceiverFrameIdentifier
             * @function getTypeUrl
             * @memberof bayesmech.vision.PerceiverFrameIdentifier
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            PerceiverFrameIdentifier.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/bayesmech.vision.PerceiverFrameIdentifier";
            };

            return PerceiverFrameIdentifier;
        })();

        vision.CameraIntrinsics = (function() {

            /**
             * Properties of a CameraIntrinsics.
             * @memberof bayesmech.vision
             * @interface ICameraIntrinsics
             * @property {number|null} [fx] CameraIntrinsics fx
             * @property {number|null} [fy] CameraIntrinsics fy
             * @property {number|null} [cx] CameraIntrinsics cx
             * @property {number|null} [cy] CameraIntrinsics cy
             * @property {number|null} [imageWidth] CameraIntrinsics imageWidth
             * @property {number|null} [imageHeight] CameraIntrinsics imageHeight
             * @property {number|null} [depthWidth] CameraIntrinsics depthWidth
             * @property {number|null} [depthHeight] CameraIntrinsics depthHeight
             */

            /**
             * Constructs a new CameraIntrinsics.
             * @memberof bayesmech.vision
             * @classdesc Represents a CameraIntrinsics.
             * @implements ICameraIntrinsics
             * @constructor
             * @param {bayesmech.vision.ICameraIntrinsics=} [properties] Properties to set
             */
            function CameraIntrinsics(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * CameraIntrinsics fx.
             * @member {number} fx
             * @memberof bayesmech.vision.CameraIntrinsics
             * @instance
             */
            CameraIntrinsics.prototype.fx = 0;

            /**
             * CameraIntrinsics fy.
             * @member {number} fy
             * @memberof bayesmech.vision.CameraIntrinsics
             * @instance
             */
            CameraIntrinsics.prototype.fy = 0;

            /**
             * CameraIntrinsics cx.
             * @member {number} cx
             * @memberof bayesmech.vision.CameraIntrinsics
             * @instance
             */
            CameraIntrinsics.prototype.cx = 0;

            /**
             * CameraIntrinsics cy.
             * @member {number} cy
             * @memberof bayesmech.vision.CameraIntrinsics
             * @instance
             */
            CameraIntrinsics.prototype.cy = 0;

            /**
             * CameraIntrinsics imageWidth.
             * @member {number} imageWidth
             * @memberof bayesmech.vision.CameraIntrinsics
             * @instance
             */
            CameraIntrinsics.prototype.imageWidth = 0;

            /**
             * CameraIntrinsics imageHeight.
             * @member {number} imageHeight
             * @memberof bayesmech.vision.CameraIntrinsics
             * @instance
             */
            CameraIntrinsics.prototype.imageHeight = 0;

            /**
             * CameraIntrinsics depthWidth.
             * @member {number} depthWidth
             * @memberof bayesmech.vision.CameraIntrinsics
             * @instance
             */
            CameraIntrinsics.prototype.depthWidth = 0;

            /**
             * CameraIntrinsics depthHeight.
             * @member {number} depthHeight
             * @memberof bayesmech.vision.CameraIntrinsics
             * @instance
             */
            CameraIntrinsics.prototype.depthHeight = 0;

            /**
             * Creates a new CameraIntrinsics instance using the specified properties.
             * @function create
             * @memberof bayesmech.vision.CameraIntrinsics
             * @static
             * @param {bayesmech.vision.ICameraIntrinsics=} [properties] Properties to set
             * @returns {bayesmech.vision.CameraIntrinsics} CameraIntrinsics instance
             */
            CameraIntrinsics.create = function create(properties) {
                return new CameraIntrinsics(properties);
            };

            /**
             * Encodes the specified CameraIntrinsics message. Does not implicitly {@link bayesmech.vision.CameraIntrinsics.verify|verify} messages.
             * @function encode
             * @memberof bayesmech.vision.CameraIntrinsics
             * @static
             * @param {bayesmech.vision.ICameraIntrinsics} message CameraIntrinsics message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CameraIntrinsics.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.fx != null && Object.hasOwnProperty.call(message, "fx"))
                    writer.uint32(/* id 1, wireType 5 =*/13).float(message.fx);
                if (message.fy != null && Object.hasOwnProperty.call(message, "fy"))
                    writer.uint32(/* id 2, wireType 5 =*/21).float(message.fy);
                if (message.cx != null && Object.hasOwnProperty.call(message, "cx"))
                    writer.uint32(/* id 3, wireType 5 =*/29).float(message.cx);
                if (message.cy != null && Object.hasOwnProperty.call(message, "cy"))
                    writer.uint32(/* id 4, wireType 5 =*/37).float(message.cy);
                if (message.imageWidth != null && Object.hasOwnProperty.call(message, "imageWidth"))
                    writer.uint32(/* id 5, wireType 5 =*/45).float(message.imageWidth);
                if (message.imageHeight != null && Object.hasOwnProperty.call(message, "imageHeight"))
                    writer.uint32(/* id 6, wireType 5 =*/53).float(message.imageHeight);
                if (message.depthWidth != null && Object.hasOwnProperty.call(message, "depthWidth"))
                    writer.uint32(/* id 7, wireType 5 =*/61).float(message.depthWidth);
                if (message.depthHeight != null && Object.hasOwnProperty.call(message, "depthHeight"))
                    writer.uint32(/* id 8, wireType 5 =*/69).float(message.depthHeight);
                return writer;
            };

            /**
             * Encodes the specified CameraIntrinsics message, length delimited. Does not implicitly {@link bayesmech.vision.CameraIntrinsics.verify|verify} messages.
             * @function encodeDelimited
             * @memberof bayesmech.vision.CameraIntrinsics
             * @static
             * @param {bayesmech.vision.ICameraIntrinsics} message CameraIntrinsics message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CameraIntrinsics.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a CameraIntrinsics message from the specified reader or buffer.
             * @function decode
             * @memberof bayesmech.vision.CameraIntrinsics
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {bayesmech.vision.CameraIntrinsics} CameraIntrinsics
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CameraIntrinsics.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.bayesmech.vision.CameraIntrinsics();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.fx = reader.float();
                            break;
                        }
                    case 2: {
                            message.fy = reader.float();
                            break;
                        }
                    case 3: {
                            message.cx = reader.float();
                            break;
                        }
                    case 4: {
                            message.cy = reader.float();
                            break;
                        }
                    case 5: {
                            message.imageWidth = reader.float();
                            break;
                        }
                    case 6: {
                            message.imageHeight = reader.float();
                            break;
                        }
                    case 7: {
                            message.depthWidth = reader.float();
                            break;
                        }
                    case 8: {
                            message.depthHeight = reader.float();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a CameraIntrinsics message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof bayesmech.vision.CameraIntrinsics
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {bayesmech.vision.CameraIntrinsics} CameraIntrinsics
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CameraIntrinsics.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a CameraIntrinsics message.
             * @function verify
             * @memberof bayesmech.vision.CameraIntrinsics
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            CameraIntrinsics.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.fx != null && message.hasOwnProperty("fx"))
                    if (typeof message.fx !== "number")
                        return "fx: number expected";
                if (message.fy != null && message.hasOwnProperty("fy"))
                    if (typeof message.fy !== "number")
                        return "fy: number expected";
                if (message.cx != null && message.hasOwnProperty("cx"))
                    if (typeof message.cx !== "number")
                        return "cx: number expected";
                if (message.cy != null && message.hasOwnProperty("cy"))
                    if (typeof message.cy !== "number")
                        return "cy: number expected";
                if (message.imageWidth != null && message.hasOwnProperty("imageWidth"))
                    if (typeof message.imageWidth !== "number")
                        return "imageWidth: number expected";
                if (message.imageHeight != null && message.hasOwnProperty("imageHeight"))
                    if (typeof message.imageHeight !== "number")
                        return "imageHeight: number expected";
                if (message.depthWidth != null && message.hasOwnProperty("depthWidth"))
                    if (typeof message.depthWidth !== "number")
                        return "depthWidth: number expected";
                if (message.depthHeight != null && message.hasOwnProperty("depthHeight"))
                    if (typeof message.depthHeight !== "number")
                        return "depthHeight: number expected";
                return null;
            };

            /**
             * Creates a CameraIntrinsics message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof bayesmech.vision.CameraIntrinsics
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {bayesmech.vision.CameraIntrinsics} CameraIntrinsics
             */
            CameraIntrinsics.fromObject = function fromObject(object) {
                if (object instanceof $root.bayesmech.vision.CameraIntrinsics)
                    return object;
                let message = new $root.bayesmech.vision.CameraIntrinsics();
                if (object.fx != null)
                    message.fx = Number(object.fx);
                if (object.fy != null)
                    message.fy = Number(object.fy);
                if (object.cx != null)
                    message.cx = Number(object.cx);
                if (object.cy != null)
                    message.cy = Number(object.cy);
                if (object.imageWidth != null)
                    message.imageWidth = Number(object.imageWidth);
                if (object.imageHeight != null)
                    message.imageHeight = Number(object.imageHeight);
                if (object.depthWidth != null)
                    message.depthWidth = Number(object.depthWidth);
                if (object.depthHeight != null)
                    message.depthHeight = Number(object.depthHeight);
                return message;
            };

            /**
             * Creates a plain object from a CameraIntrinsics message. Also converts values to other types if specified.
             * @function toObject
             * @memberof bayesmech.vision.CameraIntrinsics
             * @static
             * @param {bayesmech.vision.CameraIntrinsics} message CameraIntrinsics
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            CameraIntrinsics.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.fx = 0;
                    object.fy = 0;
                    object.cx = 0;
                    object.cy = 0;
                    object.imageWidth = 0;
                    object.imageHeight = 0;
                    object.depthWidth = 0;
                    object.depthHeight = 0;
                }
                if (message.fx != null && message.hasOwnProperty("fx"))
                    object.fx = options.json && !isFinite(message.fx) ? String(message.fx) : message.fx;
                if (message.fy != null && message.hasOwnProperty("fy"))
                    object.fy = options.json && !isFinite(message.fy) ? String(message.fy) : message.fy;
                if (message.cx != null && message.hasOwnProperty("cx"))
                    object.cx = options.json && !isFinite(message.cx) ? String(message.cx) : message.cx;
                if (message.cy != null && message.hasOwnProperty("cy"))
                    object.cy = options.json && !isFinite(message.cy) ? String(message.cy) : message.cy;
                if (message.imageWidth != null && message.hasOwnProperty("imageWidth"))
                    object.imageWidth = options.json && !isFinite(message.imageWidth) ? String(message.imageWidth) : message.imageWidth;
                if (message.imageHeight != null && message.hasOwnProperty("imageHeight"))
                    object.imageHeight = options.json && !isFinite(message.imageHeight) ? String(message.imageHeight) : message.imageHeight;
                if (message.depthWidth != null && message.hasOwnProperty("depthWidth"))
                    object.depthWidth = options.json && !isFinite(message.depthWidth) ? String(message.depthWidth) : message.depthWidth;
                if (message.depthHeight != null && message.hasOwnProperty("depthHeight"))
                    object.depthHeight = options.json && !isFinite(message.depthHeight) ? String(message.depthHeight) : message.depthHeight;
                return object;
            };

            /**
             * Converts this CameraIntrinsics to JSON.
             * @function toJSON
             * @memberof bayesmech.vision.CameraIntrinsics
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            CameraIntrinsics.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for CameraIntrinsics
             * @function getTypeUrl
             * @memberof bayesmech.vision.CameraIntrinsics
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            CameraIntrinsics.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/bayesmech.vision.CameraIntrinsics";
            };

            return CameraIntrinsics;
        })();

        vision.ImageFrame = (function() {

            /**
             * Properties of an ImageFrame.
             * @memberof bayesmech.vision
             * @interface IImageFrame
             * @property {Uint8Array|null} [data] ImageFrame data
             * @property {bayesmech.vision.ImageFrame.ImageFormat|null} [format] ImageFrame format
             * @property {number|null} [quality] ImageFrame quality
             */

            /**
             * Constructs a new ImageFrame.
             * @memberof bayesmech.vision
             * @classdesc Represents an ImageFrame.
             * @implements IImageFrame
             * @constructor
             * @param {bayesmech.vision.IImageFrame=} [properties] Properties to set
             */
            function ImageFrame(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ImageFrame data.
             * @member {Uint8Array} data
             * @memberof bayesmech.vision.ImageFrame
             * @instance
             */
            ImageFrame.prototype.data = $util.newBuffer([]);

            /**
             * ImageFrame format.
             * @member {bayesmech.vision.ImageFrame.ImageFormat} format
             * @memberof bayesmech.vision.ImageFrame
             * @instance
             */
            ImageFrame.prototype.format = 0;

            /**
             * ImageFrame quality.
             * @member {number} quality
             * @memberof bayesmech.vision.ImageFrame
             * @instance
             */
            ImageFrame.prototype.quality = 0;

            /**
             * Creates a new ImageFrame instance using the specified properties.
             * @function create
             * @memberof bayesmech.vision.ImageFrame
             * @static
             * @param {bayesmech.vision.IImageFrame=} [properties] Properties to set
             * @returns {bayesmech.vision.ImageFrame} ImageFrame instance
             */
            ImageFrame.create = function create(properties) {
                return new ImageFrame(properties);
            };

            /**
             * Encodes the specified ImageFrame message. Does not implicitly {@link bayesmech.vision.ImageFrame.verify|verify} messages.
             * @function encode
             * @memberof bayesmech.vision.ImageFrame
             * @static
             * @param {bayesmech.vision.IImageFrame} message ImageFrame message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ImageFrame.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                    writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.data);
                if (message.format != null && Object.hasOwnProperty.call(message, "format"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.format);
                if (message.quality != null && Object.hasOwnProperty.call(message, "quality"))
                    writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.quality);
                return writer;
            };

            /**
             * Encodes the specified ImageFrame message, length delimited. Does not implicitly {@link bayesmech.vision.ImageFrame.verify|verify} messages.
             * @function encodeDelimited
             * @memberof bayesmech.vision.ImageFrame
             * @static
             * @param {bayesmech.vision.IImageFrame} message ImageFrame message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ImageFrame.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an ImageFrame message from the specified reader or buffer.
             * @function decode
             * @memberof bayesmech.vision.ImageFrame
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {bayesmech.vision.ImageFrame} ImageFrame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ImageFrame.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.bayesmech.vision.ImageFrame();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.data = reader.bytes();
                            break;
                        }
                    case 2: {
                            message.format = reader.int32();
                            break;
                        }
                    case 5: {
                            message.quality = reader.uint32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an ImageFrame message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof bayesmech.vision.ImageFrame
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {bayesmech.vision.ImageFrame} ImageFrame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ImageFrame.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an ImageFrame message.
             * @function verify
             * @memberof bayesmech.vision.ImageFrame
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ImageFrame.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.data != null && message.hasOwnProperty("data"))
                    if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
                        return "data: buffer expected";
                if (message.format != null && message.hasOwnProperty("format"))
                    switch (message.format) {
                    default:
                        return "format: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                        break;
                    }
                if (message.quality != null && message.hasOwnProperty("quality"))
                    if (!$util.isInteger(message.quality))
                        return "quality: integer expected";
                return null;
            };

            /**
             * Creates an ImageFrame message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof bayesmech.vision.ImageFrame
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {bayesmech.vision.ImageFrame} ImageFrame
             */
            ImageFrame.fromObject = function fromObject(object) {
                if (object instanceof $root.bayesmech.vision.ImageFrame)
                    return object;
                let message = new $root.bayesmech.vision.ImageFrame();
                if (object.data != null)
                    if (typeof object.data === "string")
                        $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
                    else if (object.data.length >= 0)
                        message.data = object.data;
                switch (object.format) {
                default:
                    if (typeof object.format === "number") {
                        message.format = object.format;
                        break;
                    }
                    break;
                case "UNKNOWN":
                case 0:
                    message.format = 0;
                    break;
                case "BITMAP_RGB":
                case 1:
                    message.format = 1;
                    break;
                case "BITMAP_RGBA":
                case 2:
                    message.format = 2;
                    break;
                case "YUV_420":
                case 3:
                    message.format = 3;
                    break;
                case "JPEG":
                case 4:
                    message.format = 4;
                    break;
                case "GRAYSCALE":
                case 5:
                    message.format = 5;
                    break;
                }
                if (object.quality != null)
                    message.quality = object.quality >>> 0;
                return message;
            };

            /**
             * Creates a plain object from an ImageFrame message. Also converts values to other types if specified.
             * @function toObject
             * @memberof bayesmech.vision.ImageFrame
             * @static
             * @param {bayesmech.vision.ImageFrame} message ImageFrame
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ImageFrame.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    if (options.bytes === String)
                        object.data = "";
                    else {
                        object.data = [];
                        if (options.bytes !== Array)
                            object.data = $util.newBuffer(object.data);
                    }
                    object.format = options.enums === String ? "UNKNOWN" : 0;
                    object.quality = 0;
                }
                if (message.data != null && message.hasOwnProperty("data"))
                    object.data = options.bytes === String ? $util.base64.encode(message.data, 0, message.data.length) : options.bytes === Array ? Array.prototype.slice.call(message.data) : message.data;
                if (message.format != null && message.hasOwnProperty("format"))
                    object.format = options.enums === String ? $root.bayesmech.vision.ImageFrame.ImageFormat[message.format] === undefined ? message.format : $root.bayesmech.vision.ImageFrame.ImageFormat[message.format] : message.format;
                if (message.quality != null && message.hasOwnProperty("quality"))
                    object.quality = message.quality;
                return object;
            };

            /**
             * Converts this ImageFrame to JSON.
             * @function toJSON
             * @memberof bayesmech.vision.ImageFrame
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ImageFrame.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ImageFrame
             * @function getTypeUrl
             * @memberof bayesmech.vision.ImageFrame
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ImageFrame.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/bayesmech.vision.ImageFrame";
            };

            /**
             * ImageFormat enum.
             * @name bayesmech.vision.ImageFrame.ImageFormat
             * @enum {number}
             * @property {number} UNKNOWN=0 UNKNOWN value
             * @property {number} BITMAP_RGB=1 BITMAP_RGB value
             * @property {number} BITMAP_RGBA=2 BITMAP_RGBA value
             * @property {number} YUV_420=3 YUV_420 value
             * @property {number} JPEG=4 JPEG value
             * @property {number} GRAYSCALE=5 GRAYSCALE value
             */
            ImageFrame.ImageFormat = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "UNKNOWN"] = 0;
                values[valuesById[1] = "BITMAP_RGB"] = 1;
                values[valuesById[2] = "BITMAP_RGBA"] = 2;
                values[valuesById[3] = "YUV_420"] = 3;
                values[valuesById[4] = "JPEG"] = 4;
                values[valuesById[5] = "GRAYSCALE"] = 5;
                return values;
            })();

            return ImageFrame;
        })();

        vision.DepthFrame = (function() {

            /**
             * Properties of a DepthFrame.
             * @memberof bayesmech.vision
             * @interface IDepthFrame
             * @property {Uint8Array|null} [data] DepthFrame data
             * @property {Uint8Array|null} [confidence] DepthFrame confidence
             * @property {bayesmech.vision.DepthFrame.DepthFormat|null} [format] DepthFrame format
             */

            /**
             * Constructs a new DepthFrame.
             * @memberof bayesmech.vision
             * @classdesc Represents a DepthFrame.
             * @implements IDepthFrame
             * @constructor
             * @param {bayesmech.vision.IDepthFrame=} [properties] Properties to set
             */
            function DepthFrame(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * DepthFrame data.
             * @member {Uint8Array} data
             * @memberof bayesmech.vision.DepthFrame
             * @instance
             */
            DepthFrame.prototype.data = $util.newBuffer([]);

            /**
             * DepthFrame confidence.
             * @member {Uint8Array} confidence
             * @memberof bayesmech.vision.DepthFrame
             * @instance
             */
            DepthFrame.prototype.confidence = $util.newBuffer([]);

            /**
             * DepthFrame format.
             * @member {bayesmech.vision.DepthFrame.DepthFormat} format
             * @memberof bayesmech.vision.DepthFrame
             * @instance
             */
            DepthFrame.prototype.format = 0;

            /**
             * Creates a new DepthFrame instance using the specified properties.
             * @function create
             * @memberof bayesmech.vision.DepthFrame
             * @static
             * @param {bayesmech.vision.IDepthFrame=} [properties] Properties to set
             * @returns {bayesmech.vision.DepthFrame} DepthFrame instance
             */
            DepthFrame.create = function create(properties) {
                return new DepthFrame(properties);
            };

            /**
             * Encodes the specified DepthFrame message. Does not implicitly {@link bayesmech.vision.DepthFrame.verify|verify} messages.
             * @function encode
             * @memberof bayesmech.vision.DepthFrame
             * @static
             * @param {bayesmech.vision.IDepthFrame} message DepthFrame message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DepthFrame.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                    writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.data);
                if (message.confidence != null && Object.hasOwnProperty.call(message, "confidence"))
                    writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.confidence);
                if (message.format != null && Object.hasOwnProperty.call(message, "format"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.format);
                return writer;
            };

            /**
             * Encodes the specified DepthFrame message, length delimited. Does not implicitly {@link bayesmech.vision.DepthFrame.verify|verify} messages.
             * @function encodeDelimited
             * @memberof bayesmech.vision.DepthFrame
             * @static
             * @param {bayesmech.vision.IDepthFrame} message DepthFrame message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DepthFrame.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a DepthFrame message from the specified reader or buffer.
             * @function decode
             * @memberof bayesmech.vision.DepthFrame
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {bayesmech.vision.DepthFrame} DepthFrame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DepthFrame.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.bayesmech.vision.DepthFrame();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.data = reader.bytes();
                            break;
                        }
                    case 2: {
                            message.confidence = reader.bytes();
                            break;
                        }
                    case 3: {
                            message.format = reader.int32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a DepthFrame message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof bayesmech.vision.DepthFrame
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {bayesmech.vision.DepthFrame} DepthFrame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DepthFrame.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a DepthFrame message.
             * @function verify
             * @memberof bayesmech.vision.DepthFrame
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            DepthFrame.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.data != null && message.hasOwnProperty("data"))
                    if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
                        return "data: buffer expected";
                if (message.confidence != null && message.hasOwnProperty("confidence"))
                    if (!(message.confidence && typeof message.confidence.length === "number" || $util.isString(message.confidence)))
                        return "confidence: buffer expected";
                if (message.format != null && message.hasOwnProperty("format"))
                    switch (message.format) {
                    default:
                        return "format: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                return null;
            };

            /**
             * Creates a DepthFrame message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof bayesmech.vision.DepthFrame
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {bayesmech.vision.DepthFrame} DepthFrame
             */
            DepthFrame.fromObject = function fromObject(object) {
                if (object instanceof $root.bayesmech.vision.DepthFrame)
                    return object;
                let message = new $root.bayesmech.vision.DepthFrame();
                if (object.data != null)
                    if (typeof object.data === "string")
                        $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
                    else if (object.data.length >= 0)
                        message.data = object.data;
                if (object.confidence != null)
                    if (typeof object.confidence === "string")
                        $util.base64.decode(object.confidence, message.confidence = $util.newBuffer($util.base64.length(object.confidence)), 0);
                    else if (object.confidence.length >= 0)
                        message.confidence = object.confidence;
                switch (object.format) {
                default:
                    if (typeof object.format === "number") {
                        message.format = object.format;
                        break;
                    }
                    break;
                case "DEPTH_FORMAT_UNKNOWN":
                case 0:
                    message.format = 0;
                    break;
                case "UINT16_MILLIMETERS":
                case 1:
                    message.format = 1;
                    break;
                case "FLOAT32_METERS":
                case 2:
                    message.format = 2;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from a DepthFrame message. Also converts values to other types if specified.
             * @function toObject
             * @memberof bayesmech.vision.DepthFrame
             * @static
             * @param {bayesmech.vision.DepthFrame} message DepthFrame
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            DepthFrame.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    if (options.bytes === String)
                        object.data = "";
                    else {
                        object.data = [];
                        if (options.bytes !== Array)
                            object.data = $util.newBuffer(object.data);
                    }
                    if (options.bytes === String)
                        object.confidence = "";
                    else {
                        object.confidence = [];
                        if (options.bytes !== Array)
                            object.confidence = $util.newBuffer(object.confidence);
                    }
                    object.format = options.enums === String ? "DEPTH_FORMAT_UNKNOWN" : 0;
                }
                if (message.data != null && message.hasOwnProperty("data"))
                    object.data = options.bytes === String ? $util.base64.encode(message.data, 0, message.data.length) : options.bytes === Array ? Array.prototype.slice.call(message.data) : message.data;
                if (message.confidence != null && message.hasOwnProperty("confidence"))
                    object.confidence = options.bytes === String ? $util.base64.encode(message.confidence, 0, message.confidence.length) : options.bytes === Array ? Array.prototype.slice.call(message.confidence) : message.confidence;
                if (message.format != null && message.hasOwnProperty("format"))
                    object.format = options.enums === String ? $root.bayesmech.vision.DepthFrame.DepthFormat[message.format] === undefined ? message.format : $root.bayesmech.vision.DepthFrame.DepthFormat[message.format] : message.format;
                return object;
            };

            /**
             * Converts this DepthFrame to JSON.
             * @function toJSON
             * @memberof bayesmech.vision.DepthFrame
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            DepthFrame.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for DepthFrame
             * @function getTypeUrl
             * @memberof bayesmech.vision.DepthFrame
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            DepthFrame.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/bayesmech.vision.DepthFrame";
            };

            /**
             * DepthFormat enum.
             * @name bayesmech.vision.DepthFrame.DepthFormat
             * @enum {number}
             * @property {number} DEPTH_FORMAT_UNKNOWN=0 DEPTH_FORMAT_UNKNOWN value
             * @property {number} UINT16_MILLIMETERS=1 UINT16_MILLIMETERS value
             * @property {number} FLOAT32_METERS=2 FLOAT32_METERS value
             */
            DepthFrame.DepthFormat = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "DEPTH_FORMAT_UNKNOWN"] = 0;
                values[valuesById[1] = "UINT16_MILLIMETERS"] = 1;
                values[valuesById[2] = "FLOAT32_METERS"] = 2;
                return values;
            })();

            return DepthFrame;
        })();

        vision.ImuData = (function() {

            /**
             * Properties of an ImuData.
             * @memberof bayesmech.vision
             * @interface IImuData
             * @property {bayesmech.vision.IVector3|null} [angularVelocity] ImuData angularVelocity
             * @property {bayesmech.vision.IVector3|null} [linearAcceleration] ImuData linearAcceleration
             * @property {bayesmech.vision.IVector3|null} [gravity] ImuData gravity
             * @property {bayesmech.vision.IVector3|null} [magneticField] ImuData magneticField
             */

            /**
             * Constructs a new ImuData.
             * @memberof bayesmech.vision
             * @classdesc Represents an ImuData.
             * @implements IImuData
             * @constructor
             * @param {bayesmech.vision.IImuData=} [properties] Properties to set
             */
            function ImuData(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ImuData angularVelocity.
             * @member {bayesmech.vision.IVector3|null|undefined} angularVelocity
             * @memberof bayesmech.vision.ImuData
             * @instance
             */
            ImuData.prototype.angularVelocity = null;

            /**
             * ImuData linearAcceleration.
             * @member {bayesmech.vision.IVector3|null|undefined} linearAcceleration
             * @memberof bayesmech.vision.ImuData
             * @instance
             */
            ImuData.prototype.linearAcceleration = null;

            /**
             * ImuData gravity.
             * @member {bayesmech.vision.IVector3|null|undefined} gravity
             * @memberof bayesmech.vision.ImuData
             * @instance
             */
            ImuData.prototype.gravity = null;

            /**
             * ImuData magneticField.
             * @member {bayesmech.vision.IVector3|null|undefined} magneticField
             * @memberof bayesmech.vision.ImuData
             * @instance
             */
            ImuData.prototype.magneticField = null;

            /**
             * Creates a new ImuData instance using the specified properties.
             * @function create
             * @memberof bayesmech.vision.ImuData
             * @static
             * @param {bayesmech.vision.IImuData=} [properties] Properties to set
             * @returns {bayesmech.vision.ImuData} ImuData instance
             */
            ImuData.create = function create(properties) {
                return new ImuData(properties);
            };

            /**
             * Encodes the specified ImuData message. Does not implicitly {@link bayesmech.vision.ImuData.verify|verify} messages.
             * @function encode
             * @memberof bayesmech.vision.ImuData
             * @static
             * @param {bayesmech.vision.IImuData} message ImuData message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ImuData.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.angularVelocity != null && Object.hasOwnProperty.call(message, "angularVelocity"))
                    $root.bayesmech.vision.Vector3.encode(message.angularVelocity, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.linearAcceleration != null && Object.hasOwnProperty.call(message, "linearAcceleration"))
                    $root.bayesmech.vision.Vector3.encode(message.linearAcceleration, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.gravity != null && Object.hasOwnProperty.call(message, "gravity"))
                    $root.bayesmech.vision.Vector3.encode(message.gravity, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                if (message.magneticField != null && Object.hasOwnProperty.call(message, "magneticField"))
                    $root.bayesmech.vision.Vector3.encode(message.magneticField, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified ImuData message, length delimited. Does not implicitly {@link bayesmech.vision.ImuData.verify|verify} messages.
             * @function encodeDelimited
             * @memberof bayesmech.vision.ImuData
             * @static
             * @param {bayesmech.vision.IImuData} message ImuData message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ImuData.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an ImuData message from the specified reader or buffer.
             * @function decode
             * @memberof bayesmech.vision.ImuData
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {bayesmech.vision.ImuData} ImuData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ImuData.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.bayesmech.vision.ImuData();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.angularVelocity = $root.bayesmech.vision.Vector3.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.linearAcceleration = $root.bayesmech.vision.Vector3.decode(reader, reader.uint32());
                            break;
                        }
                    case 3: {
                            message.gravity = $root.bayesmech.vision.Vector3.decode(reader, reader.uint32());
                            break;
                        }
                    case 4: {
                            message.magneticField = $root.bayesmech.vision.Vector3.decode(reader, reader.uint32());
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an ImuData message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof bayesmech.vision.ImuData
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {bayesmech.vision.ImuData} ImuData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ImuData.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an ImuData message.
             * @function verify
             * @memberof bayesmech.vision.ImuData
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ImuData.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.angularVelocity != null && message.hasOwnProperty("angularVelocity")) {
                    let error = $root.bayesmech.vision.Vector3.verify(message.angularVelocity);
                    if (error)
                        return "angularVelocity." + error;
                }
                if (message.linearAcceleration != null && message.hasOwnProperty("linearAcceleration")) {
                    let error = $root.bayesmech.vision.Vector3.verify(message.linearAcceleration);
                    if (error)
                        return "linearAcceleration." + error;
                }
                if (message.gravity != null && message.hasOwnProperty("gravity")) {
                    let error = $root.bayesmech.vision.Vector3.verify(message.gravity);
                    if (error)
                        return "gravity." + error;
                }
                if (message.magneticField != null && message.hasOwnProperty("magneticField")) {
                    let error = $root.bayesmech.vision.Vector3.verify(message.magneticField);
                    if (error)
                        return "magneticField." + error;
                }
                return null;
            };

            /**
             * Creates an ImuData message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof bayesmech.vision.ImuData
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {bayesmech.vision.ImuData} ImuData
             */
            ImuData.fromObject = function fromObject(object) {
                if (object instanceof $root.bayesmech.vision.ImuData)
                    return object;
                let message = new $root.bayesmech.vision.ImuData();
                if (object.angularVelocity != null) {
                    if (typeof object.angularVelocity !== "object")
                        throw TypeError(".bayesmech.vision.ImuData.angularVelocity: object expected");
                    message.angularVelocity = $root.bayesmech.vision.Vector3.fromObject(object.angularVelocity);
                }
                if (object.linearAcceleration != null) {
                    if (typeof object.linearAcceleration !== "object")
                        throw TypeError(".bayesmech.vision.ImuData.linearAcceleration: object expected");
                    message.linearAcceleration = $root.bayesmech.vision.Vector3.fromObject(object.linearAcceleration);
                }
                if (object.gravity != null) {
                    if (typeof object.gravity !== "object")
                        throw TypeError(".bayesmech.vision.ImuData.gravity: object expected");
                    message.gravity = $root.bayesmech.vision.Vector3.fromObject(object.gravity);
                }
                if (object.magneticField != null) {
                    if (typeof object.magneticField !== "object")
                        throw TypeError(".bayesmech.vision.ImuData.magneticField: object expected");
                    message.magneticField = $root.bayesmech.vision.Vector3.fromObject(object.magneticField);
                }
                return message;
            };

            /**
             * Creates a plain object from an ImuData message. Also converts values to other types if specified.
             * @function toObject
             * @memberof bayesmech.vision.ImuData
             * @static
             * @param {bayesmech.vision.ImuData} message ImuData
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ImuData.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.angularVelocity = null;
                    object.linearAcceleration = null;
                    object.gravity = null;
                    object.magneticField = null;
                }
                if (message.angularVelocity != null && message.hasOwnProperty("angularVelocity"))
                    object.angularVelocity = $root.bayesmech.vision.Vector3.toObject(message.angularVelocity, options);
                if (message.linearAcceleration != null && message.hasOwnProperty("linearAcceleration"))
                    object.linearAcceleration = $root.bayesmech.vision.Vector3.toObject(message.linearAcceleration, options);
                if (message.gravity != null && message.hasOwnProperty("gravity"))
                    object.gravity = $root.bayesmech.vision.Vector3.toObject(message.gravity, options);
                if (message.magneticField != null && message.hasOwnProperty("magneticField"))
                    object.magneticField = $root.bayesmech.vision.Vector3.toObject(message.magneticField, options);
                return object;
            };

            /**
             * Converts this ImuData to JSON.
             * @function toJSON
             * @memberof bayesmech.vision.ImuData
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ImuData.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ImuData
             * @function getTypeUrl
             * @memberof bayesmech.vision.ImuData
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ImuData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/bayesmech.vision.ImuData";
            };

            return ImuData;
        })();

        vision.SegmentationResponse = (function() {

            /**
             * Properties of a SegmentationResponse.
             * @memberof bayesmech.vision
             * @interface ISegmentationResponse
             * @property {bayesmech.vision.IPerceiverFrameIdentifier|null} [frameIdentifier] SegmentationResponse frameIdentifier
             * @property {Array.<bayesmech.vision.SegmentationResponse.ISegmentationMask>|null} [masks] SegmentationResponse masks
             * @property {bayesmech.vision.SegmentationResponse.SegmentationTriggerType|null} [triggerType] SegmentationResponse triggerType
             */

            /**
             * Constructs a new SegmentationResponse.
             * @memberof bayesmech.vision
             * @classdesc Represents a SegmentationResponse.
             * @implements ISegmentationResponse
             * @constructor
             * @param {bayesmech.vision.ISegmentationResponse=} [properties] Properties to set
             */
            function SegmentationResponse(properties) {
                this.masks = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SegmentationResponse frameIdentifier.
             * @member {bayesmech.vision.IPerceiverFrameIdentifier|null|undefined} frameIdentifier
             * @memberof bayesmech.vision.SegmentationResponse
             * @instance
             */
            SegmentationResponse.prototype.frameIdentifier = null;

            /**
             * SegmentationResponse masks.
             * @member {Array.<bayesmech.vision.SegmentationResponse.ISegmentationMask>} masks
             * @memberof bayesmech.vision.SegmentationResponse
             * @instance
             */
            SegmentationResponse.prototype.masks = $util.emptyArray;

            /**
             * SegmentationResponse triggerType.
             * @member {bayesmech.vision.SegmentationResponse.SegmentationTriggerType} triggerType
             * @memberof bayesmech.vision.SegmentationResponse
             * @instance
             */
            SegmentationResponse.prototype.triggerType = 0;

            /**
             * Creates a new SegmentationResponse instance using the specified properties.
             * @function create
             * @memberof bayesmech.vision.SegmentationResponse
             * @static
             * @param {bayesmech.vision.ISegmentationResponse=} [properties] Properties to set
             * @returns {bayesmech.vision.SegmentationResponse} SegmentationResponse instance
             */
            SegmentationResponse.create = function create(properties) {
                return new SegmentationResponse(properties);
            };

            /**
             * Encodes the specified SegmentationResponse message. Does not implicitly {@link bayesmech.vision.SegmentationResponse.verify|verify} messages.
             * @function encode
             * @memberof bayesmech.vision.SegmentationResponse
             * @static
             * @param {bayesmech.vision.ISegmentationResponse} message SegmentationResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SegmentationResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.frameIdentifier != null && Object.hasOwnProperty.call(message, "frameIdentifier"))
                    $root.bayesmech.vision.PerceiverFrameIdentifier.encode(message.frameIdentifier, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.masks != null && message.masks.length)
                    for (let i = 0; i < message.masks.length; ++i)
                        $root.bayesmech.vision.SegmentationResponse.SegmentationMask.encode(message.masks[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.triggerType != null && Object.hasOwnProperty.call(message, "triggerType"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.triggerType);
                return writer;
            };

            /**
             * Encodes the specified SegmentationResponse message, length delimited. Does not implicitly {@link bayesmech.vision.SegmentationResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof bayesmech.vision.SegmentationResponse
             * @static
             * @param {bayesmech.vision.ISegmentationResponse} message SegmentationResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SegmentationResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SegmentationResponse message from the specified reader or buffer.
             * @function decode
             * @memberof bayesmech.vision.SegmentationResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {bayesmech.vision.SegmentationResponse} SegmentationResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SegmentationResponse.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.bayesmech.vision.SegmentationResponse();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.frameIdentifier = $root.bayesmech.vision.PerceiverFrameIdentifier.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            if (!(message.masks && message.masks.length))
                                message.masks = [];
                            message.masks.push($root.bayesmech.vision.SegmentationResponse.SegmentationMask.decode(reader, reader.uint32()));
                            break;
                        }
                    case 3: {
                            message.triggerType = reader.int32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a SegmentationResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof bayesmech.vision.SegmentationResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {bayesmech.vision.SegmentationResponse} SegmentationResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SegmentationResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SegmentationResponse message.
             * @function verify
             * @memberof bayesmech.vision.SegmentationResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SegmentationResponse.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.frameIdentifier != null && message.hasOwnProperty("frameIdentifier")) {
                    let error = $root.bayesmech.vision.PerceiverFrameIdentifier.verify(message.frameIdentifier);
                    if (error)
                        return "frameIdentifier." + error;
                }
                if (message.masks != null && message.hasOwnProperty("masks")) {
                    if (!Array.isArray(message.masks))
                        return "masks: array expected";
                    for (let i = 0; i < message.masks.length; ++i) {
                        let error = $root.bayesmech.vision.SegmentationResponse.SegmentationMask.verify(message.masks[i]);
                        if (error)
                            return "masks." + error;
                    }
                }
                if (message.triggerType != null && message.hasOwnProperty("triggerType"))
                    switch (message.triggerType) {
                    default:
                        return "triggerType: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                        break;
                    }
                return null;
            };

            /**
             * Creates a SegmentationResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof bayesmech.vision.SegmentationResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {bayesmech.vision.SegmentationResponse} SegmentationResponse
             */
            SegmentationResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.bayesmech.vision.SegmentationResponse)
                    return object;
                let message = new $root.bayesmech.vision.SegmentationResponse();
                if (object.frameIdentifier != null) {
                    if (typeof object.frameIdentifier !== "object")
                        throw TypeError(".bayesmech.vision.SegmentationResponse.frameIdentifier: object expected");
                    message.frameIdentifier = $root.bayesmech.vision.PerceiverFrameIdentifier.fromObject(object.frameIdentifier);
                }
                if (object.masks) {
                    if (!Array.isArray(object.masks))
                        throw TypeError(".bayesmech.vision.SegmentationResponse.masks: array expected");
                    message.masks = [];
                    for (let i = 0; i < object.masks.length; ++i) {
                        if (typeof object.masks[i] !== "object")
                            throw TypeError(".bayesmech.vision.SegmentationResponse.masks: object expected");
                        message.masks[i] = $root.bayesmech.vision.SegmentationResponse.SegmentationMask.fromObject(object.masks[i]);
                    }
                }
                switch (object.triggerType) {
                default:
                    if (typeof object.triggerType === "number") {
                        message.triggerType = object.triggerType;
                        break;
                    }
                    break;
                case "UNKNOWN":
                case 0:
                    message.triggerType = 0;
                    break;
                case "POINT":
                case 1:
                    message.triggerType = 1;
                    break;
                case "TEXT":
                case 2:
                    message.triggerType = 2;
                    break;
                case "AUTO_GRID":
                case 3:
                    message.triggerType = 3;
                    break;
                case "PROPAGATION":
                case 4:
                    message.triggerType = 4;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from a SegmentationResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof bayesmech.vision.SegmentationResponse
             * @static
             * @param {bayesmech.vision.SegmentationResponse} message SegmentationResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SegmentationResponse.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.masks = [];
                if (options.defaults) {
                    object.frameIdentifier = null;
                    object.triggerType = options.enums === String ? "UNKNOWN" : 0;
                }
                if (message.frameIdentifier != null && message.hasOwnProperty("frameIdentifier"))
                    object.frameIdentifier = $root.bayesmech.vision.PerceiverFrameIdentifier.toObject(message.frameIdentifier, options);
                if (message.masks && message.masks.length) {
                    object.masks = [];
                    for (let j = 0; j < message.masks.length; ++j)
                        object.masks[j] = $root.bayesmech.vision.SegmentationResponse.SegmentationMask.toObject(message.masks[j], options);
                }
                if (message.triggerType != null && message.hasOwnProperty("triggerType"))
                    object.triggerType = options.enums === String ? $root.bayesmech.vision.SegmentationResponse.SegmentationTriggerType[message.triggerType] === undefined ? message.triggerType : $root.bayesmech.vision.SegmentationResponse.SegmentationTriggerType[message.triggerType] : message.triggerType;
                return object;
            };

            /**
             * Converts this SegmentationResponse to JSON.
             * @function toJSON
             * @memberof bayesmech.vision.SegmentationResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SegmentationResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for SegmentationResponse
             * @function getTypeUrl
             * @memberof bayesmech.vision.SegmentationResponse
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            SegmentationResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/bayesmech.vision.SegmentationResponse";
            };

            SegmentationResponse.SegmentationMask = (function() {

                /**
                 * Properties of a SegmentationMask.
                 * @memberof bayesmech.vision.SegmentationResponse
                 * @interface ISegmentationMask
                 * @property {number|null} [objectId] SegmentationMask objectId
                 * @property {Uint8Array|null} [maskData] SegmentationMask maskData
                 * @property {number|null} [confidence] SegmentationMask confidence
                 * @property {number|null} [pixelCount] SegmentationMask pixelCount
                 */

                /**
                 * Constructs a new SegmentationMask.
                 * @memberof bayesmech.vision.SegmentationResponse
                 * @classdesc Represents a SegmentationMask.
                 * @implements ISegmentationMask
                 * @constructor
                 * @param {bayesmech.vision.SegmentationResponse.ISegmentationMask=} [properties] Properties to set
                 */
                function SegmentationMask(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * SegmentationMask objectId.
                 * @member {number} objectId
                 * @memberof bayesmech.vision.SegmentationResponse.SegmentationMask
                 * @instance
                 */
                SegmentationMask.prototype.objectId = 0;

                /**
                 * SegmentationMask maskData.
                 * @member {Uint8Array} maskData
                 * @memberof bayesmech.vision.SegmentationResponse.SegmentationMask
                 * @instance
                 */
                SegmentationMask.prototype.maskData = $util.newBuffer([]);

                /**
                 * SegmentationMask confidence.
                 * @member {number} confidence
                 * @memberof bayesmech.vision.SegmentationResponse.SegmentationMask
                 * @instance
                 */
                SegmentationMask.prototype.confidence = 0;

                /**
                 * SegmentationMask pixelCount.
                 * @member {number} pixelCount
                 * @memberof bayesmech.vision.SegmentationResponse.SegmentationMask
                 * @instance
                 */
                SegmentationMask.prototype.pixelCount = 0;

                /**
                 * Creates a new SegmentationMask instance using the specified properties.
                 * @function create
                 * @memberof bayesmech.vision.SegmentationResponse.SegmentationMask
                 * @static
                 * @param {bayesmech.vision.SegmentationResponse.ISegmentationMask=} [properties] Properties to set
                 * @returns {bayesmech.vision.SegmentationResponse.SegmentationMask} SegmentationMask instance
                 */
                SegmentationMask.create = function create(properties) {
                    return new SegmentationMask(properties);
                };

                /**
                 * Encodes the specified SegmentationMask message. Does not implicitly {@link bayesmech.vision.SegmentationResponse.SegmentationMask.verify|verify} messages.
                 * @function encode
                 * @memberof bayesmech.vision.SegmentationResponse.SegmentationMask
                 * @static
                 * @param {bayesmech.vision.SegmentationResponse.ISegmentationMask} message SegmentationMask message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                SegmentationMask.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.objectId != null && Object.hasOwnProperty.call(message, "objectId"))
                        writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.objectId);
                    if (message.maskData != null && Object.hasOwnProperty.call(message, "maskData"))
                        writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.maskData);
                    if (message.confidence != null && Object.hasOwnProperty.call(message, "confidence"))
                        writer.uint32(/* id 3, wireType 5 =*/29).float(message.confidence);
                    if (message.pixelCount != null && Object.hasOwnProperty.call(message, "pixelCount"))
                        writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.pixelCount);
                    return writer;
                };

                /**
                 * Encodes the specified SegmentationMask message, length delimited. Does not implicitly {@link bayesmech.vision.SegmentationResponse.SegmentationMask.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof bayesmech.vision.SegmentationResponse.SegmentationMask
                 * @static
                 * @param {bayesmech.vision.SegmentationResponse.ISegmentationMask} message SegmentationMask message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                SegmentationMask.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a SegmentationMask message from the specified reader or buffer.
                 * @function decode
                 * @memberof bayesmech.vision.SegmentationResponse.SegmentationMask
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {bayesmech.vision.SegmentationResponse.SegmentationMask} SegmentationMask
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                SegmentationMask.decode = function decode(reader, length, error) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.bayesmech.vision.SegmentationResponse.SegmentationMask();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        if (tag === error)
                            break;
                        switch (tag >>> 3) {
                        case 1: {
                                message.objectId = reader.uint32();
                                break;
                            }
                        case 2: {
                                message.maskData = reader.bytes();
                                break;
                            }
                        case 3: {
                                message.confidence = reader.float();
                                break;
                            }
                        case 4: {
                                message.pixelCount = reader.uint32();
                                break;
                            }
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a SegmentationMask message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof bayesmech.vision.SegmentationResponse.SegmentationMask
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {bayesmech.vision.SegmentationResponse.SegmentationMask} SegmentationMask
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                SegmentationMask.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a SegmentationMask message.
                 * @function verify
                 * @memberof bayesmech.vision.SegmentationResponse.SegmentationMask
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                SegmentationMask.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.objectId != null && message.hasOwnProperty("objectId"))
                        if (!$util.isInteger(message.objectId))
                            return "objectId: integer expected";
                    if (message.maskData != null && message.hasOwnProperty("maskData"))
                        if (!(message.maskData && typeof message.maskData.length === "number" || $util.isString(message.maskData)))
                            return "maskData: buffer expected";
                    if (message.confidence != null && message.hasOwnProperty("confidence"))
                        if (typeof message.confidence !== "number")
                            return "confidence: number expected";
                    if (message.pixelCount != null && message.hasOwnProperty("pixelCount"))
                        if (!$util.isInteger(message.pixelCount))
                            return "pixelCount: integer expected";
                    return null;
                };

                /**
                 * Creates a SegmentationMask message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof bayesmech.vision.SegmentationResponse.SegmentationMask
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {bayesmech.vision.SegmentationResponse.SegmentationMask} SegmentationMask
                 */
                SegmentationMask.fromObject = function fromObject(object) {
                    if (object instanceof $root.bayesmech.vision.SegmentationResponse.SegmentationMask)
                        return object;
                    let message = new $root.bayesmech.vision.SegmentationResponse.SegmentationMask();
                    if (object.objectId != null)
                        message.objectId = object.objectId >>> 0;
                    if (object.maskData != null)
                        if (typeof object.maskData === "string")
                            $util.base64.decode(object.maskData, message.maskData = $util.newBuffer($util.base64.length(object.maskData)), 0);
                        else if (object.maskData.length >= 0)
                            message.maskData = object.maskData;
                    if (object.confidence != null)
                        message.confidence = Number(object.confidence);
                    if (object.pixelCount != null)
                        message.pixelCount = object.pixelCount >>> 0;
                    return message;
                };

                /**
                 * Creates a plain object from a SegmentationMask message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof bayesmech.vision.SegmentationResponse.SegmentationMask
                 * @static
                 * @param {bayesmech.vision.SegmentationResponse.SegmentationMask} message SegmentationMask
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                SegmentationMask.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.defaults) {
                        object.objectId = 0;
                        if (options.bytes === String)
                            object.maskData = "";
                        else {
                            object.maskData = [];
                            if (options.bytes !== Array)
                                object.maskData = $util.newBuffer(object.maskData);
                        }
                        object.confidence = 0;
                        object.pixelCount = 0;
                    }
                    if (message.objectId != null && message.hasOwnProperty("objectId"))
                        object.objectId = message.objectId;
                    if (message.maskData != null && message.hasOwnProperty("maskData"))
                        object.maskData = options.bytes === String ? $util.base64.encode(message.maskData, 0, message.maskData.length) : options.bytes === Array ? Array.prototype.slice.call(message.maskData) : message.maskData;
                    if (message.confidence != null && message.hasOwnProperty("confidence"))
                        object.confidence = options.json && !isFinite(message.confidence) ? String(message.confidence) : message.confidence;
                    if (message.pixelCount != null && message.hasOwnProperty("pixelCount"))
                        object.pixelCount = message.pixelCount;
                    return object;
                };

                /**
                 * Converts this SegmentationMask to JSON.
                 * @function toJSON
                 * @memberof bayesmech.vision.SegmentationResponse.SegmentationMask
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                SegmentationMask.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for SegmentationMask
                 * @function getTypeUrl
                 * @memberof bayesmech.vision.SegmentationResponse.SegmentationMask
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                SegmentationMask.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/bayesmech.vision.SegmentationResponse.SegmentationMask";
                };

                return SegmentationMask;
            })();

            /**
             * SegmentationTriggerType enum.
             * @name bayesmech.vision.SegmentationResponse.SegmentationTriggerType
             * @enum {number}
             * @property {number} UNKNOWN=0 UNKNOWN value
             * @property {number} POINT=1 POINT value
             * @property {number} TEXT=2 TEXT value
             * @property {number} AUTO_GRID=3 AUTO_GRID value
             * @property {number} PROPAGATION=4 PROPAGATION value
             */
            SegmentationResponse.SegmentationTriggerType = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "UNKNOWN"] = 0;
                values[valuesById[1] = "POINT"] = 1;
                values[valuesById[2] = "TEXT"] = 2;
                values[valuesById[3] = "AUTO_GRID"] = 3;
                values[valuesById[4] = "PROPAGATION"] = 4;
                return values;
            })();

            return SegmentationResponse;
        })();

        vision.SegmentationRequest = (function() {

            /**
             * Properties of a SegmentationRequest.
             * @memberof bayesmech.vision
             * @interface ISegmentationRequest
             * @property {bayesmech.vision.IPerceiverFrameIdentifier|null} [frameIdentifier] SegmentationRequest frameIdentifier
             * @property {bayesmech.vision.IImageFrame|null} [imageFrame] SegmentationRequest imageFrame
             */

            /**
             * Constructs a new SegmentationRequest.
             * @memberof bayesmech.vision
             * @classdesc Represents a SegmentationRequest.
             * @implements ISegmentationRequest
             * @constructor
             * @param {bayesmech.vision.ISegmentationRequest=} [properties] Properties to set
             */
            function SegmentationRequest(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SegmentationRequest frameIdentifier.
             * @member {bayesmech.vision.IPerceiverFrameIdentifier|null|undefined} frameIdentifier
             * @memberof bayesmech.vision.SegmentationRequest
             * @instance
             */
            SegmentationRequest.prototype.frameIdentifier = null;

            /**
             * SegmentationRequest imageFrame.
             * @member {bayesmech.vision.IImageFrame|null|undefined} imageFrame
             * @memberof bayesmech.vision.SegmentationRequest
             * @instance
             */
            SegmentationRequest.prototype.imageFrame = null;

            /**
             * Creates a new SegmentationRequest instance using the specified properties.
             * @function create
             * @memberof bayesmech.vision.SegmentationRequest
             * @static
             * @param {bayesmech.vision.ISegmentationRequest=} [properties] Properties to set
             * @returns {bayesmech.vision.SegmentationRequest} SegmentationRequest instance
             */
            SegmentationRequest.create = function create(properties) {
                return new SegmentationRequest(properties);
            };

            /**
             * Encodes the specified SegmentationRequest message. Does not implicitly {@link bayesmech.vision.SegmentationRequest.verify|verify} messages.
             * @function encode
             * @memberof bayesmech.vision.SegmentationRequest
             * @static
             * @param {bayesmech.vision.ISegmentationRequest} message SegmentationRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SegmentationRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.frameIdentifier != null && Object.hasOwnProperty.call(message, "frameIdentifier"))
                    $root.bayesmech.vision.PerceiverFrameIdentifier.encode(message.frameIdentifier, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.imageFrame != null && Object.hasOwnProperty.call(message, "imageFrame"))
                    $root.bayesmech.vision.ImageFrame.encode(message.imageFrame, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified SegmentationRequest message, length delimited. Does not implicitly {@link bayesmech.vision.SegmentationRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof bayesmech.vision.SegmentationRequest
             * @static
             * @param {bayesmech.vision.ISegmentationRequest} message SegmentationRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SegmentationRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SegmentationRequest message from the specified reader or buffer.
             * @function decode
             * @memberof bayesmech.vision.SegmentationRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {bayesmech.vision.SegmentationRequest} SegmentationRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SegmentationRequest.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.bayesmech.vision.SegmentationRequest();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.frameIdentifier = $root.bayesmech.vision.PerceiverFrameIdentifier.decode(reader, reader.uint32());
                            break;
                        }
                    case 2: {
                            message.imageFrame = $root.bayesmech.vision.ImageFrame.decode(reader, reader.uint32());
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a SegmentationRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof bayesmech.vision.SegmentationRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {bayesmech.vision.SegmentationRequest} SegmentationRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SegmentationRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SegmentationRequest message.
             * @function verify
             * @memberof bayesmech.vision.SegmentationRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SegmentationRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.frameIdentifier != null && message.hasOwnProperty("frameIdentifier")) {
                    let error = $root.bayesmech.vision.PerceiverFrameIdentifier.verify(message.frameIdentifier);
                    if (error)
                        return "frameIdentifier." + error;
                }
                if (message.imageFrame != null && message.hasOwnProperty("imageFrame")) {
                    let error = $root.bayesmech.vision.ImageFrame.verify(message.imageFrame);
                    if (error)
                        return "imageFrame." + error;
                }
                return null;
            };

            /**
             * Creates a SegmentationRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof bayesmech.vision.SegmentationRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {bayesmech.vision.SegmentationRequest} SegmentationRequest
             */
            SegmentationRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.bayesmech.vision.SegmentationRequest)
                    return object;
                let message = new $root.bayesmech.vision.SegmentationRequest();
                if (object.frameIdentifier != null) {
                    if (typeof object.frameIdentifier !== "object")
                        throw TypeError(".bayesmech.vision.SegmentationRequest.frameIdentifier: object expected");
                    message.frameIdentifier = $root.bayesmech.vision.PerceiverFrameIdentifier.fromObject(object.frameIdentifier);
                }
                if (object.imageFrame != null) {
                    if (typeof object.imageFrame !== "object")
                        throw TypeError(".bayesmech.vision.SegmentationRequest.imageFrame: object expected");
                    message.imageFrame = $root.bayesmech.vision.ImageFrame.fromObject(object.imageFrame);
                }
                return message;
            };

            /**
             * Creates a plain object from a SegmentationRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof bayesmech.vision.SegmentationRequest
             * @static
             * @param {bayesmech.vision.SegmentationRequest} message SegmentationRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SegmentationRequest.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.frameIdentifier = null;
                    object.imageFrame = null;
                }
                if (message.frameIdentifier != null && message.hasOwnProperty("frameIdentifier"))
                    object.frameIdentifier = $root.bayesmech.vision.PerceiverFrameIdentifier.toObject(message.frameIdentifier, options);
                if (message.imageFrame != null && message.hasOwnProperty("imageFrame"))
                    object.imageFrame = $root.bayesmech.vision.ImageFrame.toObject(message.imageFrame, options);
                return object;
            };

            /**
             * Converts this SegmentationRequest to JSON.
             * @function toJSON
             * @memberof bayesmech.vision.SegmentationRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SegmentationRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for SegmentationRequest
             * @function getTypeUrl
             * @memberof bayesmech.vision.SegmentationRequest
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            SegmentationRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/bayesmech.vision.SegmentationRequest";
            };

            return SegmentationRequest;
        })();

        return vision;
    })();

    return bayesmech;
})();

export { $root as default };
