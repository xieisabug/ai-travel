export namespace Route {
	export type LinksFunction = () => Array<{ rel: string; href: string; crossOrigin?: string }>;
	export interface ErrorBoundaryProps {
		error: unknown;
	}
}

type RouteContract = {
	LinksFunction: Route.LinksFunction;
	ErrorBoundaryProps: Route.ErrorBoundaryProps;
};

declare const route: RouteContract;
export type Route = typeof route;
export default route;
