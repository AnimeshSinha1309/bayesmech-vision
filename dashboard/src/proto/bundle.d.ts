import * as $protobuf from "protobufjs";
import type Long from "long";
/** Namespace bayesmech. */
export namespace bayesmech {

    /** Namespace vision. */
    namespace vision {

        /** Properties of a Pose. */
        interface IPose {

            /** Pose position */
            position?: (bayesmech.vision.IVector3|null);

            /** Pose rotation */
            rotation?: (bayesmech.vision.IQuaternion|null);
        }

        /** Represents a Pose. */
        class Pose implements IPose {

            /**
             * Constructs a new Pose.
             * @param [properties] Properties to set
             */
            constructor(properties?: bayesmech.vision.IPose);

            /** Pose position. */
            public position?: (bayesmech.vision.IVector3|null);

            /** Pose rotation. */
            public rotation?: (bayesmech.vision.IQuaternion|null);

            /**
             * Creates a new Pose instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Pose instance
             */
            public static create(properties?: bayesmech.vision.IPose): bayesmech.vision.Pose;

            /**
             * Encodes the specified Pose message. Does not implicitly {@link bayesmech.vision.Pose.verify|verify} messages.
             * @param message Pose message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: bayesmech.vision.IPose, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Pose message, length delimited. Does not implicitly {@link bayesmech.vision.Pose.verify|verify} messages.
             * @param message Pose message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: bayesmech.vision.IPose, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Pose message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Pose
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): bayesmech.vision.Pose;

            /**
             * Decodes a Pose message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Pose
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): bayesmech.vision.Pose;

            /**
             * Verifies a Pose message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Pose message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Pose
             */
            public static fromObject(object: { [k: string]: any }): bayesmech.vision.Pose;

            /**
             * Creates a plain object from a Pose message. Also converts values to other types if specified.
             * @param message Pose
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: bayesmech.vision.Pose, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Pose to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Pose
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Vector3. */
        interface IVector3 {

            /** Vector3 x */
            x?: (number|null);

            /** Vector3 y */
            y?: (number|null);

            /** Vector3 z */
            z?: (number|null);
        }

        /** Represents a Vector3. */
        class Vector3 implements IVector3 {

            /**
             * Constructs a new Vector3.
             * @param [properties] Properties to set
             */
            constructor(properties?: bayesmech.vision.IVector3);

            /** Vector3 x. */
            public x: number;

            /** Vector3 y. */
            public y: number;

            /** Vector3 z. */
            public z: number;

            /**
             * Creates a new Vector3 instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Vector3 instance
             */
            public static create(properties?: bayesmech.vision.IVector3): bayesmech.vision.Vector3;

            /**
             * Encodes the specified Vector3 message. Does not implicitly {@link bayesmech.vision.Vector3.verify|verify} messages.
             * @param message Vector3 message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: bayesmech.vision.IVector3, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Vector3 message, length delimited. Does not implicitly {@link bayesmech.vision.Vector3.verify|verify} messages.
             * @param message Vector3 message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: bayesmech.vision.IVector3, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Vector3 message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Vector3
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): bayesmech.vision.Vector3;

            /**
             * Decodes a Vector3 message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Vector3
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): bayesmech.vision.Vector3;

            /**
             * Verifies a Vector3 message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Vector3 message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Vector3
             */
            public static fromObject(object: { [k: string]: any }): bayesmech.vision.Vector3;

            /**
             * Creates a plain object from a Vector3 message. Also converts values to other types if specified.
             * @param message Vector3
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: bayesmech.vision.Vector3, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Vector3 to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Vector3
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Quaternion. */
        interface IQuaternion {

            /** Quaternion x */
            x?: (number|null);

            /** Quaternion y */
            y?: (number|null);

            /** Quaternion z */
            z?: (number|null);

            /** Quaternion w */
            w?: (number|null);
        }

        /** Represents a Quaternion. */
        class Quaternion implements IQuaternion {

            /**
             * Constructs a new Quaternion.
             * @param [properties] Properties to set
             */
            constructor(properties?: bayesmech.vision.IQuaternion);

            /** Quaternion x. */
            public x: number;

            /** Quaternion y. */
            public y: number;

            /** Quaternion z. */
            public z: number;

            /** Quaternion w. */
            public w: number;

            /**
             * Creates a new Quaternion instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Quaternion instance
             */
            public static create(properties?: bayesmech.vision.IQuaternion): bayesmech.vision.Quaternion;

            /**
             * Encodes the specified Quaternion message. Does not implicitly {@link bayesmech.vision.Quaternion.verify|verify} messages.
             * @param message Quaternion message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: bayesmech.vision.IQuaternion, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Quaternion message, length delimited. Does not implicitly {@link bayesmech.vision.Quaternion.verify|verify} messages.
             * @param message Quaternion message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: bayesmech.vision.IQuaternion, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Quaternion message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Quaternion
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): bayesmech.vision.Quaternion;

            /**
             * Decodes a Quaternion message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Quaternion
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): bayesmech.vision.Quaternion;

            /**
             * Verifies a Quaternion message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Quaternion message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Quaternion
             */
            public static fromObject(object: { [k: string]: any }): bayesmech.vision.Quaternion;

            /**
             * Creates a plain object from a Quaternion message. Also converts values to other types if specified.
             * @param message Quaternion
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: bayesmech.vision.Quaternion, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Quaternion to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Quaternion
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an InferredGeometry. */
        interface IInferredGeometry {

            /** InferredGeometry planes */
            planes?: (bayesmech.vision.InferredGeometry.IPlane[]|null);

            /** InferredGeometry pointCloud */
            pointCloud?: (bayesmech.vision.InferredGeometry.ITrackedPoint[]|null);
        }

        /** Represents an InferredGeometry. */
        class InferredGeometry implements IInferredGeometry {

            /**
             * Constructs a new InferredGeometry.
             * @param [properties] Properties to set
             */
            constructor(properties?: bayesmech.vision.IInferredGeometry);

            /** InferredGeometry planes. */
            public planes: bayesmech.vision.InferredGeometry.IPlane[];

            /** InferredGeometry pointCloud. */
            public pointCloud: bayesmech.vision.InferredGeometry.ITrackedPoint[];

            /**
             * Creates a new InferredGeometry instance using the specified properties.
             * @param [properties] Properties to set
             * @returns InferredGeometry instance
             */
            public static create(properties?: bayesmech.vision.IInferredGeometry): bayesmech.vision.InferredGeometry;

            /**
             * Encodes the specified InferredGeometry message. Does not implicitly {@link bayesmech.vision.InferredGeometry.verify|verify} messages.
             * @param message InferredGeometry message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: bayesmech.vision.IInferredGeometry, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified InferredGeometry message, length delimited. Does not implicitly {@link bayesmech.vision.InferredGeometry.verify|verify} messages.
             * @param message InferredGeometry message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: bayesmech.vision.IInferredGeometry, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an InferredGeometry message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns InferredGeometry
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): bayesmech.vision.InferredGeometry;

            /**
             * Decodes an InferredGeometry message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns InferredGeometry
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): bayesmech.vision.InferredGeometry;

            /**
             * Verifies an InferredGeometry message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an InferredGeometry message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns InferredGeometry
             */
            public static fromObject(object: { [k: string]: any }): bayesmech.vision.InferredGeometry;

            /**
             * Creates a plain object from an InferredGeometry message. Also converts values to other types if specified.
             * @param message InferredGeometry
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: bayesmech.vision.InferredGeometry, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this InferredGeometry to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for InferredGeometry
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace InferredGeometry {

            /** Properties of a Plane. */
            interface IPlane {

                /** Plane id */
                id?: (Uint8Array|null);

                /** Plane centerPose */
                centerPose?: (bayesmech.vision.IPose|null);

                /** Plane extentX */
                extentX?: (number|null);

                /** Plane extentZ */
                extentZ?: (number|null);

                /** Plane type */
                type?: (bayesmech.vision.InferredGeometry.Plane.PlaneType|null);

                /** Plane polygon */
                polygon?: (bayesmech.vision.IVector3[]|null);
            }

            /** Represents a Plane. */
            class Plane implements IPlane {

                /**
                 * Constructs a new Plane.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: bayesmech.vision.InferredGeometry.IPlane);

                /** Plane id. */
                public id: Uint8Array;

                /** Plane centerPose. */
                public centerPose?: (bayesmech.vision.IPose|null);

                /** Plane extentX. */
                public extentX: number;

                /** Plane extentZ. */
                public extentZ: number;

                /** Plane type. */
                public type: bayesmech.vision.InferredGeometry.Plane.PlaneType;

                /** Plane polygon. */
                public polygon: bayesmech.vision.IVector3[];

                /**
                 * Creates a new Plane instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Plane instance
                 */
                public static create(properties?: bayesmech.vision.InferredGeometry.IPlane): bayesmech.vision.InferredGeometry.Plane;

                /**
                 * Encodes the specified Plane message. Does not implicitly {@link bayesmech.vision.InferredGeometry.Plane.verify|verify} messages.
                 * @param message Plane message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: bayesmech.vision.InferredGeometry.IPlane, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Plane message, length delimited. Does not implicitly {@link bayesmech.vision.InferredGeometry.Plane.verify|verify} messages.
                 * @param message Plane message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: bayesmech.vision.InferredGeometry.IPlane, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Plane message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Plane
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): bayesmech.vision.InferredGeometry.Plane;

                /**
                 * Decodes a Plane message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Plane
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): bayesmech.vision.InferredGeometry.Plane;

                /**
                 * Verifies a Plane message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Plane message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Plane
                 */
                public static fromObject(object: { [k: string]: any }): bayesmech.vision.InferredGeometry.Plane;

                /**
                 * Creates a plain object from a Plane message. Also converts values to other types if specified.
                 * @param message Plane
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: bayesmech.vision.InferredGeometry.Plane, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Plane to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for Plane
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            namespace Plane {

                /** PlaneType enum. */
                enum PlaneType {
                    PLANE_TYPE_UNKNOWN = 0,
                    HORIZONTAL_UPWARD_FACING = 1,
                    HORIZONTAL_DOWNWARD_FACING = 2,
                    VERTICAL = 3
                }
            }

            /** Properties of a TrackedPoint. */
            interface ITrackedPoint {

                /** TrackedPoint point */
                point?: (bayesmech.vision.IVector3|null);

                /** TrackedPoint confidence */
                confidence?: (number|null);
            }

            /** Represents a TrackedPoint. */
            class TrackedPoint implements ITrackedPoint {

                /**
                 * Constructs a new TrackedPoint.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: bayesmech.vision.InferredGeometry.ITrackedPoint);

                /** TrackedPoint point. */
                public point?: (bayesmech.vision.IVector3|null);

                /** TrackedPoint confidence. */
                public confidence: number;

                /**
                 * Creates a new TrackedPoint instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns TrackedPoint instance
                 */
                public static create(properties?: bayesmech.vision.InferredGeometry.ITrackedPoint): bayesmech.vision.InferredGeometry.TrackedPoint;

                /**
                 * Encodes the specified TrackedPoint message. Does not implicitly {@link bayesmech.vision.InferredGeometry.TrackedPoint.verify|verify} messages.
                 * @param message TrackedPoint message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: bayesmech.vision.InferredGeometry.ITrackedPoint, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TrackedPoint message, length delimited. Does not implicitly {@link bayesmech.vision.InferredGeometry.TrackedPoint.verify|verify} messages.
                 * @param message TrackedPoint message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: bayesmech.vision.InferredGeometry.ITrackedPoint, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TrackedPoint message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TrackedPoint
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): bayesmech.vision.InferredGeometry.TrackedPoint;

                /**
                 * Decodes a TrackedPoint message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TrackedPoint
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): bayesmech.vision.InferredGeometry.TrackedPoint;

                /**
                 * Verifies a TrackedPoint message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TrackedPoint message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TrackedPoint
                 */
                public static fromObject(object: { [k: string]: any }): bayesmech.vision.InferredGeometry.TrackedPoint;

                /**
                 * Creates a plain object from a TrackedPoint message. Also converts values to other types if specified.
                 * @param message TrackedPoint
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: bayesmech.vision.InferredGeometry.TrackedPoint, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TrackedPoint to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for TrackedPoint
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }
        }

        /** Properties of a PerceiverDataFrame. */
        interface IPerceiverDataFrame {

            /** PerceiverDataFrame frameIdentifier */
            frameIdentifier?: (bayesmech.vision.IPerceiverFrameIdentifier|null);

            /** PerceiverDataFrame cameraPose */
            cameraPose?: (bayesmech.vision.IPose|null);

            /** PerceiverDataFrame rgbFrame */
            rgbFrame?: (bayesmech.vision.IImageFrame|null);

            /** PerceiverDataFrame depthFrame */
            depthFrame?: (bayesmech.vision.IDepthFrame|null);

            /** PerceiverDataFrame imuData */
            imuData?: (bayesmech.vision.IImuData|null);

            /** PerceiverDataFrame cameraIntrinsics */
            cameraIntrinsics?: (bayesmech.vision.ICameraIntrinsics|null);

            /** PerceiverDataFrame inferredGeometry */
            inferredGeometry?: (bayesmech.vision.IInferredGeometry|null);
        }

        /** Represents a PerceiverDataFrame. */
        class PerceiverDataFrame implements IPerceiverDataFrame {

            /**
             * Constructs a new PerceiverDataFrame.
             * @param [properties] Properties to set
             */
            constructor(properties?: bayesmech.vision.IPerceiverDataFrame);

            /** PerceiverDataFrame frameIdentifier. */
            public frameIdentifier?: (bayesmech.vision.IPerceiverFrameIdentifier|null);

            /** PerceiverDataFrame cameraPose. */
            public cameraPose?: (bayesmech.vision.IPose|null);

            /** PerceiverDataFrame rgbFrame. */
            public rgbFrame?: (bayesmech.vision.IImageFrame|null);

            /** PerceiverDataFrame depthFrame. */
            public depthFrame?: (bayesmech.vision.IDepthFrame|null);

            /** PerceiverDataFrame imuData. */
            public imuData?: (bayesmech.vision.IImuData|null);

            /** PerceiverDataFrame cameraIntrinsics. */
            public cameraIntrinsics?: (bayesmech.vision.ICameraIntrinsics|null);

            /** PerceiverDataFrame inferredGeometry. */
            public inferredGeometry?: (bayesmech.vision.IInferredGeometry|null);

            /**
             * Creates a new PerceiverDataFrame instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PerceiverDataFrame instance
             */
            public static create(properties?: bayesmech.vision.IPerceiverDataFrame): bayesmech.vision.PerceiverDataFrame;

            /**
             * Encodes the specified PerceiverDataFrame message. Does not implicitly {@link bayesmech.vision.PerceiverDataFrame.verify|verify} messages.
             * @param message PerceiverDataFrame message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: bayesmech.vision.IPerceiverDataFrame, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PerceiverDataFrame message, length delimited. Does not implicitly {@link bayesmech.vision.PerceiverDataFrame.verify|verify} messages.
             * @param message PerceiverDataFrame message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: bayesmech.vision.IPerceiverDataFrame, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PerceiverDataFrame message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PerceiverDataFrame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): bayesmech.vision.PerceiverDataFrame;

            /**
             * Decodes a PerceiverDataFrame message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PerceiverDataFrame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): bayesmech.vision.PerceiverDataFrame;

            /**
             * Verifies a PerceiverDataFrame message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PerceiverDataFrame message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PerceiverDataFrame
             */
            public static fromObject(object: { [k: string]: any }): bayesmech.vision.PerceiverDataFrame;

            /**
             * Creates a plain object from a PerceiverDataFrame message. Also converts values to other types if specified.
             * @param message PerceiverDataFrame
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: bayesmech.vision.PerceiverDataFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PerceiverDataFrame to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for PerceiverDataFrame
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a PerceiverFrameIdentifier. */
        interface IPerceiverFrameIdentifier {

            /** PerceiverFrameIdentifier timestampNs */
            timestampNs?: (number|Long|null);

            /** PerceiverFrameIdentifier frameNumber */
            frameNumber?: (number|null);

            /** PerceiverFrameIdentifier deviceId */
            deviceId?: (string|null);
        }

        /** Represents a PerceiverFrameIdentifier. */
        class PerceiverFrameIdentifier implements IPerceiverFrameIdentifier {

            /**
             * Constructs a new PerceiverFrameIdentifier.
             * @param [properties] Properties to set
             */
            constructor(properties?: bayesmech.vision.IPerceiverFrameIdentifier);

            /** PerceiverFrameIdentifier timestampNs. */
            public timestampNs: (number|Long);

            /** PerceiverFrameIdentifier frameNumber. */
            public frameNumber: number;

            /** PerceiverFrameIdentifier deviceId. */
            public deviceId: string;

            /**
             * Creates a new PerceiverFrameIdentifier instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PerceiverFrameIdentifier instance
             */
            public static create(properties?: bayesmech.vision.IPerceiverFrameIdentifier): bayesmech.vision.PerceiverFrameIdentifier;

            /**
             * Encodes the specified PerceiverFrameIdentifier message. Does not implicitly {@link bayesmech.vision.PerceiverFrameIdentifier.verify|verify} messages.
             * @param message PerceiverFrameIdentifier message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: bayesmech.vision.IPerceiverFrameIdentifier, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PerceiverFrameIdentifier message, length delimited. Does not implicitly {@link bayesmech.vision.PerceiverFrameIdentifier.verify|verify} messages.
             * @param message PerceiverFrameIdentifier message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: bayesmech.vision.IPerceiverFrameIdentifier, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PerceiverFrameIdentifier message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PerceiverFrameIdentifier
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): bayesmech.vision.PerceiverFrameIdentifier;

            /**
             * Decodes a PerceiverFrameIdentifier message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PerceiverFrameIdentifier
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): bayesmech.vision.PerceiverFrameIdentifier;

            /**
             * Verifies a PerceiverFrameIdentifier message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PerceiverFrameIdentifier message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PerceiverFrameIdentifier
             */
            public static fromObject(object: { [k: string]: any }): bayesmech.vision.PerceiverFrameIdentifier;

            /**
             * Creates a plain object from a PerceiverFrameIdentifier message. Also converts values to other types if specified.
             * @param message PerceiverFrameIdentifier
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: bayesmech.vision.PerceiverFrameIdentifier, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PerceiverFrameIdentifier to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for PerceiverFrameIdentifier
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a CameraIntrinsics. */
        interface ICameraIntrinsics {

            /** CameraIntrinsics fx */
            fx?: (number|null);

            /** CameraIntrinsics fy */
            fy?: (number|null);

            /** CameraIntrinsics cx */
            cx?: (number|null);

            /** CameraIntrinsics cy */
            cy?: (number|null);

            /** CameraIntrinsics imageWidth */
            imageWidth?: (number|null);

            /** CameraIntrinsics imageHeight */
            imageHeight?: (number|null);

            /** CameraIntrinsics depthWidth */
            depthWidth?: (number|null);

            /** CameraIntrinsics depthHeight */
            depthHeight?: (number|null);
        }

        /** Represents a CameraIntrinsics. */
        class CameraIntrinsics implements ICameraIntrinsics {

            /**
             * Constructs a new CameraIntrinsics.
             * @param [properties] Properties to set
             */
            constructor(properties?: bayesmech.vision.ICameraIntrinsics);

            /** CameraIntrinsics fx. */
            public fx: number;

            /** CameraIntrinsics fy. */
            public fy: number;

            /** CameraIntrinsics cx. */
            public cx: number;

            /** CameraIntrinsics cy. */
            public cy: number;

            /** CameraIntrinsics imageWidth. */
            public imageWidth: number;

            /** CameraIntrinsics imageHeight. */
            public imageHeight: number;

            /** CameraIntrinsics depthWidth. */
            public depthWidth: number;

            /** CameraIntrinsics depthHeight. */
            public depthHeight: number;

            /**
             * Creates a new CameraIntrinsics instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CameraIntrinsics instance
             */
            public static create(properties?: bayesmech.vision.ICameraIntrinsics): bayesmech.vision.CameraIntrinsics;

            /**
             * Encodes the specified CameraIntrinsics message. Does not implicitly {@link bayesmech.vision.CameraIntrinsics.verify|verify} messages.
             * @param message CameraIntrinsics message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: bayesmech.vision.ICameraIntrinsics, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CameraIntrinsics message, length delimited. Does not implicitly {@link bayesmech.vision.CameraIntrinsics.verify|verify} messages.
             * @param message CameraIntrinsics message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: bayesmech.vision.ICameraIntrinsics, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CameraIntrinsics message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns CameraIntrinsics
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): bayesmech.vision.CameraIntrinsics;

            /**
             * Decodes a CameraIntrinsics message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns CameraIntrinsics
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): bayesmech.vision.CameraIntrinsics;

            /**
             * Verifies a CameraIntrinsics message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CameraIntrinsics message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CameraIntrinsics
             */
            public static fromObject(object: { [k: string]: any }): bayesmech.vision.CameraIntrinsics;

            /**
             * Creates a plain object from a CameraIntrinsics message. Also converts values to other types if specified.
             * @param message CameraIntrinsics
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: bayesmech.vision.CameraIntrinsics, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CameraIntrinsics to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for CameraIntrinsics
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an ImageFrame. */
        interface IImageFrame {

            /** ImageFrame data */
            data?: (Uint8Array|null);

            /** ImageFrame format */
            format?: (bayesmech.vision.ImageFrame.ImageFormat|null);

            /** ImageFrame quality */
            quality?: (number|null);
        }

        /** Represents an ImageFrame. */
        class ImageFrame implements IImageFrame {

            /**
             * Constructs a new ImageFrame.
             * @param [properties] Properties to set
             */
            constructor(properties?: bayesmech.vision.IImageFrame);

            /** ImageFrame data. */
            public data: Uint8Array;

            /** ImageFrame format. */
            public format: bayesmech.vision.ImageFrame.ImageFormat;

            /** ImageFrame quality. */
            public quality: number;

            /**
             * Creates a new ImageFrame instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ImageFrame instance
             */
            public static create(properties?: bayesmech.vision.IImageFrame): bayesmech.vision.ImageFrame;

            /**
             * Encodes the specified ImageFrame message. Does not implicitly {@link bayesmech.vision.ImageFrame.verify|verify} messages.
             * @param message ImageFrame message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: bayesmech.vision.IImageFrame, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ImageFrame message, length delimited. Does not implicitly {@link bayesmech.vision.ImageFrame.verify|verify} messages.
             * @param message ImageFrame message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: bayesmech.vision.IImageFrame, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an ImageFrame message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ImageFrame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): bayesmech.vision.ImageFrame;

            /**
             * Decodes an ImageFrame message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ImageFrame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): bayesmech.vision.ImageFrame;

            /**
             * Verifies an ImageFrame message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an ImageFrame message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ImageFrame
             */
            public static fromObject(object: { [k: string]: any }): bayesmech.vision.ImageFrame;

            /**
             * Creates a plain object from an ImageFrame message. Also converts values to other types if specified.
             * @param message ImageFrame
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: bayesmech.vision.ImageFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ImageFrame to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ImageFrame
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace ImageFrame {

            /** ImageFormat enum. */
            enum ImageFormat {
                UNKNOWN = 0,
                BITMAP_RGB = 1,
                BITMAP_RGBA = 2,
                YUV_420 = 3,
                JPEG = 4,
                GRAYSCALE = 5
            }
        }

        /** Properties of a DepthFrame. */
        interface IDepthFrame {

            /** DepthFrame data */
            data?: (Uint8Array|null);

            /** DepthFrame confidence */
            confidence?: (Uint8Array|null);

            /** DepthFrame format */
            format?: (bayesmech.vision.DepthFrame.DepthFormat|null);
        }

        /** Represents a DepthFrame. */
        class DepthFrame implements IDepthFrame {

            /**
             * Constructs a new DepthFrame.
             * @param [properties] Properties to set
             */
            constructor(properties?: bayesmech.vision.IDepthFrame);

            /** DepthFrame data. */
            public data: Uint8Array;

            /** DepthFrame confidence. */
            public confidence: Uint8Array;

            /** DepthFrame format. */
            public format: bayesmech.vision.DepthFrame.DepthFormat;

            /**
             * Creates a new DepthFrame instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DepthFrame instance
             */
            public static create(properties?: bayesmech.vision.IDepthFrame): bayesmech.vision.DepthFrame;

            /**
             * Encodes the specified DepthFrame message. Does not implicitly {@link bayesmech.vision.DepthFrame.verify|verify} messages.
             * @param message DepthFrame message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: bayesmech.vision.IDepthFrame, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DepthFrame message, length delimited. Does not implicitly {@link bayesmech.vision.DepthFrame.verify|verify} messages.
             * @param message DepthFrame message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: bayesmech.vision.IDepthFrame, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DepthFrame message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DepthFrame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): bayesmech.vision.DepthFrame;

            /**
             * Decodes a DepthFrame message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DepthFrame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): bayesmech.vision.DepthFrame;

            /**
             * Verifies a DepthFrame message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DepthFrame message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DepthFrame
             */
            public static fromObject(object: { [k: string]: any }): bayesmech.vision.DepthFrame;

            /**
             * Creates a plain object from a DepthFrame message. Also converts values to other types if specified.
             * @param message DepthFrame
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: bayesmech.vision.DepthFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DepthFrame to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for DepthFrame
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace DepthFrame {

            /** DepthFormat enum. */
            enum DepthFormat {
                DEPTH_FORMAT_UNKNOWN = 0,
                UINT16_MILLIMETERS = 1,
                FLOAT32_METERS = 2
            }
        }

        /** Properties of an ImuData. */
        interface IImuData {

            /** ImuData angularVelocity */
            angularVelocity?: (bayesmech.vision.IVector3|null);

            /** ImuData linearAcceleration */
            linearAcceleration?: (bayesmech.vision.IVector3|null);

            /** ImuData gravity */
            gravity?: (bayesmech.vision.IVector3|null);

            /** ImuData magneticField */
            magneticField?: (bayesmech.vision.IVector3|null);
        }

        /** Represents an ImuData. */
        class ImuData implements IImuData {

            /**
             * Constructs a new ImuData.
             * @param [properties] Properties to set
             */
            constructor(properties?: bayesmech.vision.IImuData);

            /** ImuData angularVelocity. */
            public angularVelocity?: (bayesmech.vision.IVector3|null);

            /** ImuData linearAcceleration. */
            public linearAcceleration?: (bayesmech.vision.IVector3|null);

            /** ImuData gravity. */
            public gravity?: (bayesmech.vision.IVector3|null);

            /** ImuData magneticField. */
            public magneticField?: (bayesmech.vision.IVector3|null);

            /**
             * Creates a new ImuData instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ImuData instance
             */
            public static create(properties?: bayesmech.vision.IImuData): bayesmech.vision.ImuData;

            /**
             * Encodes the specified ImuData message. Does not implicitly {@link bayesmech.vision.ImuData.verify|verify} messages.
             * @param message ImuData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: bayesmech.vision.IImuData, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ImuData message, length delimited. Does not implicitly {@link bayesmech.vision.ImuData.verify|verify} messages.
             * @param message ImuData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: bayesmech.vision.IImuData, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an ImuData message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ImuData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): bayesmech.vision.ImuData;

            /**
             * Decodes an ImuData message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ImuData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): bayesmech.vision.ImuData;

            /**
             * Verifies an ImuData message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an ImuData message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ImuData
             */
            public static fromObject(object: { [k: string]: any }): bayesmech.vision.ImuData;

            /**
             * Creates a plain object from an ImuData message. Also converts values to other types if specified.
             * @param message ImuData
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: bayesmech.vision.ImuData, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ImuData to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ImuData
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SegmentationResponse. */
        interface ISegmentationResponse {

            /** SegmentationResponse frameIdentifier */
            frameIdentifier?: (bayesmech.vision.IPerceiverFrameIdentifier|null);

            /** SegmentationResponse masks */
            masks?: (bayesmech.vision.SegmentationResponse.ISegmentationMask[]|null);

            /** SegmentationResponse triggerType */
            triggerType?: (bayesmech.vision.SegmentationResponse.SegmentationTriggerType|null);
        }

        /** Represents a SegmentationResponse. */
        class SegmentationResponse implements ISegmentationResponse {

            /**
             * Constructs a new SegmentationResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: bayesmech.vision.ISegmentationResponse);

            /** SegmentationResponse frameIdentifier. */
            public frameIdentifier?: (bayesmech.vision.IPerceiverFrameIdentifier|null);

            /** SegmentationResponse masks. */
            public masks: bayesmech.vision.SegmentationResponse.ISegmentationMask[];

            /** SegmentationResponse triggerType. */
            public triggerType: bayesmech.vision.SegmentationResponse.SegmentationTriggerType;

            /**
             * Creates a new SegmentationResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SegmentationResponse instance
             */
            public static create(properties?: bayesmech.vision.ISegmentationResponse): bayesmech.vision.SegmentationResponse;

            /**
             * Encodes the specified SegmentationResponse message. Does not implicitly {@link bayesmech.vision.SegmentationResponse.verify|verify} messages.
             * @param message SegmentationResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: bayesmech.vision.ISegmentationResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SegmentationResponse message, length delimited. Does not implicitly {@link bayesmech.vision.SegmentationResponse.verify|verify} messages.
             * @param message SegmentationResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: bayesmech.vision.ISegmentationResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SegmentationResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SegmentationResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): bayesmech.vision.SegmentationResponse;

            /**
             * Decodes a SegmentationResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SegmentationResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): bayesmech.vision.SegmentationResponse;

            /**
             * Verifies a SegmentationResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SegmentationResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SegmentationResponse
             */
            public static fromObject(object: { [k: string]: any }): bayesmech.vision.SegmentationResponse;

            /**
             * Creates a plain object from a SegmentationResponse message. Also converts values to other types if specified.
             * @param message SegmentationResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: bayesmech.vision.SegmentationResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SegmentationResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for SegmentationResponse
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace SegmentationResponse {

            /** Properties of a SegmentationMask. */
            interface ISegmentationMask {

                /** SegmentationMask objectId */
                objectId?: (number|null);

                /** SegmentationMask maskData */
                maskData?: (Uint8Array|null);

                /** SegmentationMask confidence */
                confidence?: (number|null);

                /** SegmentationMask pixelCount */
                pixelCount?: (number|null);
            }

            /** Represents a SegmentationMask. */
            class SegmentationMask implements ISegmentationMask {

                /**
                 * Constructs a new SegmentationMask.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: bayesmech.vision.SegmentationResponse.ISegmentationMask);

                /** SegmentationMask objectId. */
                public objectId: number;

                /** SegmentationMask maskData. */
                public maskData: Uint8Array;

                /** SegmentationMask confidence. */
                public confidence: number;

                /** SegmentationMask pixelCount. */
                public pixelCount: number;

                /**
                 * Creates a new SegmentationMask instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns SegmentationMask instance
                 */
                public static create(properties?: bayesmech.vision.SegmentationResponse.ISegmentationMask): bayesmech.vision.SegmentationResponse.SegmentationMask;

                /**
                 * Encodes the specified SegmentationMask message. Does not implicitly {@link bayesmech.vision.SegmentationResponse.SegmentationMask.verify|verify} messages.
                 * @param message SegmentationMask message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: bayesmech.vision.SegmentationResponse.ISegmentationMask, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified SegmentationMask message, length delimited. Does not implicitly {@link bayesmech.vision.SegmentationResponse.SegmentationMask.verify|verify} messages.
                 * @param message SegmentationMask message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: bayesmech.vision.SegmentationResponse.ISegmentationMask, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a SegmentationMask message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns SegmentationMask
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): bayesmech.vision.SegmentationResponse.SegmentationMask;

                /**
                 * Decodes a SegmentationMask message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns SegmentationMask
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): bayesmech.vision.SegmentationResponse.SegmentationMask;

                /**
                 * Verifies a SegmentationMask message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a SegmentationMask message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns SegmentationMask
                 */
                public static fromObject(object: { [k: string]: any }): bayesmech.vision.SegmentationResponse.SegmentationMask;

                /**
                 * Creates a plain object from a SegmentationMask message. Also converts values to other types if specified.
                 * @param message SegmentationMask
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: bayesmech.vision.SegmentationResponse.SegmentationMask, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this SegmentationMask to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for SegmentationMask
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** SegmentationTriggerType enum. */
            enum SegmentationTriggerType {
                UNKNOWN = 0,
                POINT = 1,
                TEXT = 2,
                AUTO_GRID = 3,
                PROPAGATION = 4
            }
        }

        /** Properties of a SegmentationRequest. */
        interface ISegmentationRequest {

            /** SegmentationRequest frameIdentifier */
            frameIdentifier?: (bayesmech.vision.IPerceiverFrameIdentifier|null);

            /** SegmentationRequest imageFrame */
            imageFrame?: (bayesmech.vision.IImageFrame|null);
        }

        /** Represents a SegmentationRequest. */
        class SegmentationRequest implements ISegmentationRequest {

            /**
             * Constructs a new SegmentationRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: bayesmech.vision.ISegmentationRequest);

            /** SegmentationRequest frameIdentifier. */
            public frameIdentifier?: (bayesmech.vision.IPerceiverFrameIdentifier|null);

            /** SegmentationRequest imageFrame. */
            public imageFrame?: (bayesmech.vision.IImageFrame|null);

            /**
             * Creates a new SegmentationRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SegmentationRequest instance
             */
            public static create(properties?: bayesmech.vision.ISegmentationRequest): bayesmech.vision.SegmentationRequest;

            /**
             * Encodes the specified SegmentationRequest message. Does not implicitly {@link bayesmech.vision.SegmentationRequest.verify|verify} messages.
             * @param message SegmentationRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: bayesmech.vision.ISegmentationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SegmentationRequest message, length delimited. Does not implicitly {@link bayesmech.vision.SegmentationRequest.verify|verify} messages.
             * @param message SegmentationRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: bayesmech.vision.ISegmentationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SegmentationRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SegmentationRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): bayesmech.vision.SegmentationRequest;

            /**
             * Decodes a SegmentationRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SegmentationRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): bayesmech.vision.SegmentationRequest;

            /**
             * Verifies a SegmentationRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SegmentationRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SegmentationRequest
             */
            public static fromObject(object: { [k: string]: any }): bayesmech.vision.SegmentationRequest;

            /**
             * Creates a plain object from a SegmentationRequest message. Also converts values to other types if specified.
             * @param message SegmentationRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: bayesmech.vision.SegmentationRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SegmentationRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for SegmentationRequest
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }
}
