import { Spinner } from "@san/ui/components/spinner";

export function Loader() {
	return (
		<div className="flex h-screen w-full items-center justify-center bg-background">
			<Spinner />
		</div>
	);
}
