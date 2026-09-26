# Generic 2D devices

Original vector frames are defined in `features/aso-screenshot-studio/domain/devices.ts` and rendered by `render/svg.ts`. No vendor trademarks or third-party models are embedded. Frames use normalized dimensions plus screen rectangle/radius masks. Each device owns its screenshot reference; the screenshot is rendered with cover fitting inside the mask. Midnight, Silver and Tablet are front-facing variants; perspective angles are not yet included. Rotation is shared with every other element.
