import { type ReactNode, useRef } from 'react';
import {
    motion,
    useInView,
    type Transition,
    type Variants,
} from 'framer-motion';

interface AnimatedElementProps {
    children: ReactNode;
    className?: string;
    /** Direction the element enters from */
    direction?: 'up' | 'down' | 'left' | 'right';
    /** Distance in pixels the element travels */
    distance?: number;
    /** Delay in seconds */
    delay?: number;
    /** Duration in seconds */
    duration?: number;
    /** Only animate once? */
    once?: boolean;
    /** IntersectionObserver threshold */
    threshold?: number;
    /** Stagger index — useful inside .map() loops */
    staggerIndex?: number;
    /** Base delay per stagger step (seconds) */
    staggerDelay?: number;
    /** Scale effect on entry */
    scale?: number;
    /** Custom variants */
    variants?: Variants;
    /** Custom transition */
    transition?: Transition;
}

const directionMap = {
    up: { x: 0, y: 1 },
    down: { x: 0, y: -1 },
    left: { x: 1, y: 0 },
    right: { x: -1, y: 0 },
};

/**
 * AnimatedElement — A lightweight wrapper for animating any element on scroll.
 *
 * Supports directional entry, stagger delays for lists, and custom variants.
 * Use this to individually animate headings, cards, images, etc.
 *
 * @example
 * // Simple fade-up
 * <AnimatedElement>
 *   <h2>Title</h2>
 * </AnimatedElement>
 *
 * @example
 * // Staggered list
 * {items.map((item, i) => (
 *   <AnimatedElement key={i} staggerIndex={i} direction="left">
 *     <Card data={item} />
 *   </AnimatedElement>
 * ))}
 */
export default function AnimatedElement({
    children,
    className = '',
    direction = 'up',
    distance = 50,
    delay = 0,
    duration = 0.7,
    once = true,
    threshold = 0.2,
    staggerIndex = 0,
    staggerDelay = 0.1,
    scale,
    variants,
    transition,
}: AnimatedElementProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once, amount: threshold });

    const dir = directionMap[direction];
    const totalDelay = delay + staggerIndex * staggerDelay;

    const defaultVariants: Variants = {
        hidden: {
            opacity: 0,
            x: dir.x * distance,
            y: dir.y * distance,
            ...(scale !== undefined ? { scale } : {}),
        },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            ...(scale !== undefined ? { scale: 1 } : {}),
        },
    };

    const resolvedVariants = variants ?? defaultVariants;

    const resolvedTransition: Transition = transition ?? {
        duration,
        delay: totalDelay,
        ease: [0.22, 1, 0.36, 1],
    };

    return (
        <motion.div
            ref={ref}
            className={className}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={resolvedVariants}
            transition={resolvedTransition}
        >
            {children}
        </motion.div>
    );
}
