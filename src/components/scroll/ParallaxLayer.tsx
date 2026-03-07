import { type ReactNode, useContext, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ScrollContext } from './ScrollContainer';

interface ParallaxLayerProps {
    children?: ReactNode;
    className?: string;
    /** Parallax speed factor. 0 = static, 1 = full scroll, -0.5 = slow reverse */
    speed?: number;
    /** Additional horizontal parallax */
    horizontalSpeed?: number;
    /** Scale effect driven by scroll */
    scaleRange?: [number, number];
    /** Opacity range driven by scroll */
    opacityRange?: [number, number];
    /** Rotation range in degrees */
    rotateRange?: [number, number];
}

/**
 * ParallaxLayer — A scroll-driven parallax effect.
 *
 * Place inside a ScrollSection to create depth with layered
 * background elements that move at different speeds.
 *
 * @example
 * <ScrollSection>
 *   <ParallaxLayer speed={-0.3} className="absolute inset-0">
 *     <div className="w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
 *   </ParallaxLayer>
 *   <div className="relative z-10">
 *     <h2>Foreground content</h2>
 *   </div>
 * </ScrollSection>
 */
export default function ParallaxLayer({
    children,
    className = '',
    speed = -0.3,
    horizontalSpeed = 0,
    scaleRange,
    opacityRange,
    rotateRange,
}: ParallaxLayerProps) {
    const elementRef = useRef(null);
    const scrollCtx = useContext(ScrollContext);

    const { scrollYProgress } = useScroll({
        target: elementRef,
        container: scrollCtx?.containerRef ?? undefined,
        offset: ['start end', 'end start'],
    });

    // Smooth out the scroll value
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    // Vertical parallax
    const y = useTransform(smoothProgress, [0, 1], [speed * 200, -speed * 200]);

    // Horizontal parallax
    const x = useTransform(
        smoothProgress,
        [0, 1],
        [horizontalSpeed * 200, -horizontalSpeed * 200]
    );

    // Optional scale
    const scale = scaleRange
        ? useTransform(smoothProgress, [0, 0.5, 1], [scaleRange[0], 1, scaleRange[1]])
        : undefined;

    // Optional opacity
    const opacity = opacityRange
        ? useTransform(smoothProgress, [0, 0.3, 0.7, 1], [
            opacityRange[0],
            1,
            1,
            opacityRange[1],
        ])
        : undefined;

    // Optional rotation
    const rotate = rotateRange
        ? useTransform(smoothProgress, [0, 1], rotateRange)
        : undefined;

    return (
        <motion.div
            ref={elementRef}
            className={`will-change-transform ${className}`}
            style={{
                y,
                x,
                ...(scale !== undefined ? { scale } : {}),
                ...(opacity !== undefined ? { opacity } : {}),
                ...(rotate !== undefined ? { rotate } : {}),
            }}
        >
            {children}
        </motion.div>
    );
}
