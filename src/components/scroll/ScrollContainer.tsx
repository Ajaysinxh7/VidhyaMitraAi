import { type ReactNode, useRef } from 'react';
import { motion, useScroll, useSpring, type MotionValue } from 'framer-motion';
import React from 'react';

interface ScrollContainerProps {
    children: ReactNode;
    className?: string;
    /** Enable/disable scroll-snap behavior */
    snap?: boolean;
    /** Snap alignment: 'start' | 'center' | 'end' */
    snapAlign?: 'start' | 'center' | 'end';
    /** Show a smooth scroll-progress indicator at the top */
    showProgress?: boolean;
    /** Color of the progress bar */
    progressColor?: string;
}

interface ScrollContextType {
    containerRef: React.RefObject<HTMLDivElement | null>;
    scrollYProgress: MotionValue<number>;
}

export const ScrollContext = React.createContext<ScrollContextType | null>(null);

/**
 * ScrollContainer — A full-page scroll wrapper with snap behavior.
 *
 * Wraps your sections in a scroll-snap container with an optional
 * scroll-progress indicator. Provides scroll context to children.
 *
 * @example
 * <ScrollContainer showProgress>
 *   <ScrollSection>…</ScrollSection>
 *   <ScrollSection>…</ScrollSection>
 * </ScrollContainer>
 */
export default function ScrollContainer({
    children,
    className = '',
    snap = true,
    snapAlign: _snapAlign = 'start',
    showProgress = false,
    progressColor = 'from-blue-500 via-indigo-500 to-purple-500',
}: ScrollContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({ container: containerRef });

    // Smooth spring for progress bar
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    return (
        <ScrollContext.Provider value={{ containerRef, scrollYProgress }}>
            <div
                ref={containerRef}
                className={`
                    scroll-container
                    relative h-[calc(100vh-4rem)] overflow-y-scroll scroll-smooth
                    ${snap ? 'snap-y snap-mandatory' : ''}
                    ${className}
                `}
            >
                {/* Scroll progress bar */}
                {showProgress && (
                    <motion.div
                        className={`fixed top-0 left-0 right-0 h-[3px] z-[100] bg-gradient-to-r ${progressColor} origin-left`}
                        style={{ scaleX }}
                    />
                )}

                {children}
            </div>
        </ScrollContext.Provider>
    );
}
