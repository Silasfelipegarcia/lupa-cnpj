export interface RouteSeoConfig {
  title: string;
  description: string;
  index?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}
