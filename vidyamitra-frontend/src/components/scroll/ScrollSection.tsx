import { type ReactNode, useRef } from 'react';
import {
    motion,
    useInView,
    type Variants,
    type Transition,
} from 'framer-motion';

/**
 * Preset animation styles — pick one or supply your own variants.
 */
export type AnimationPreset =
    | 'fade-up'
    | 'fade-down'
    | 'fade-left'
    | 'fade-right'
    | 'zoom-in'
    | 'zoom-out'
    | 'blur-in'
    | 'rotate-in'
    | 'none';

const presetVariants: Record<AnimationPreset, Variants> = {
    'fade-up': {
        hidden: { opacity: 0, y: 80 },
        visible: { opacity: 1, y: 0 },
    },
    'fade-down': {
        hidden: { opacity: 0, y: -80 },
        visible: { opacity: 1, y: 0 },
    },
    'fade-left': {
        hidden: { opacity: 0, x: -100 },
        visible: { opacity: 1, x: 0 },
    },
    'fade-right': {
        hidden: { opacity: 0, x: 100 },
        visible: { opacity: 1, x: 0 },
    },
    'zoom-in': {
        hidden: { opacity: 0, scale: 0.85 },
        visible: { opacity: 1, scale: 1 },
    },
    'zoom-out': {
        hidden: { opacity: 0, scale: 1.15 },
        visible: { opacity: 1, scale: 1 },
    },
    'blur-in': {
        hidden: { opacity: 0, filter: 'blur(12px)' },
        visible: { opacity: 1, filter: 'blur(0px)' },
    },
    'rotate-in': {
        hidden: { opacity: 0, rotate: -5, y: 60 },
        visible: { opacity: 1, rotate: 0, y: 0 },
    },
    none: {
        hidden: {},
        visible: {},
    },
};

interface ScrollSectionProps {
    children: ReactNode;
    className?: string;
    /** Animation preset to use on entry */
    animation?: AnimationPreset;
    /** Custom Framer Motion variants (overrides preset) */
    variants?: Variants;
    /** Transition config */
    transition?: Transition;
    /** Delay before this section animates in (seconds) */
    delay?: number;
    /** Whether the animation only fires once */
    once?: boolean;
    /** IntersectionObserver threshold — how much of the section must be visible */
    threshold?: number;
    /** Additional styling for the inner content wrapper */
    innerClassName?: string;
    /** Full-height section (default true) */
    fullHeight?: boolean;
    /** Snap alignment for this section */
    snapAlign?: 'start' | 'center' | 'end' | 'none';
    /** Unique ID for this section (useful for navigation) */
    id?: string;
}

/**
 * ScrollSection — A single 100vh section that animates on scroll.
 *
 * Wrap your content in this component inside a <ScrollContainer>.
 * Each section snaps into view and smoothly reveals its contents.
 *
 * @example
 * <ScrollSection animation="fade-up" delay={0.1}>
 *   <h2>Hello World</h2>
 * </ScrollSection>
 *
 * @example
 * // Custom variants
 * <ScrollSection variants={{
 *   hidden: { opacity: 0, rotateX: 45 },
 *   visible: { opacity: 1, rotateX: 0 },
 * }}>
 *   <MyComponent />
 * </ScrollSection>
 */
export default function ScrollSection({
    children,
    className = '',
    animation = 'fade-up',
    variants,
    transition,
    delay = 0,
    once = true,
    threshold = 0.25,
    innerClassName = '',
    fullHeight = true,
    snapAlign = 'start',
    id,
}: ScrollSectionProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, {
        once,
        amount: threshold,
    });

    const resolvedVariants = variants ?? presetVariants[animation];

    const resolvedTransition: Transition = transition ?? {
        duration: 0.9,
        delay,
        ease: [0.22, 1, 0.36, 1], // Apple-style cubic-bezier
    };

    const snapClass =
        snapAlign === 'none' ? '' : `snap-${snapAlign}`;

    return (
        <section
            id={id}
            ref={ref}
            className={`
                ${fullHeight ? 'min-h-[calc(100vh-4rem)]' : ''}
                flex items-center justify-center
                ${snapClass}
                relative
                ${className}
            `}
        >
            <motion.div
                className={`w-full ${innerClassName}`}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={resolvedVariants}
                transition={resolvedTransition}
            >
                {children}
            </motion.div>
        </section>
    );
}
