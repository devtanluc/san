import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

type Props = {
	enabled: boolean;
	onReach: () => void;
};

export function InfiniteScrollSentinel({ enabled, onReach }: Props) {
	const { ref, inView } = useInView({ rootMargin: "400px 0px" });

	useEffect(() => {
		if (inView && enabled) onReach();
	}, [inView, enabled, onReach]);

	return <div ref={ref} className="h-px" aria-hidden="true" />;
}
