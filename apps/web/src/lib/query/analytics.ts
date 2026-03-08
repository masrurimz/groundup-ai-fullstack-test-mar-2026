import {
  getAlertTrendsApiV1AnalyticsAlertTrendsGetOptions,
  getAlertTrendsApiV1AnalyticsAlertTrendsGetQueryKey,
  getMachineHealthApiV1AnalyticsMachineHealthGetOptions,
  getMachineHealthApiV1AnalyticsMachineHealthGetQueryKey,
  getOverviewApiV1AnalyticsOverviewGetOptions,
  getOverviewApiV1AnalyticsOverviewGetQueryKey,
} from "../api-client/@tanstack/react-query.gen";

export const overviewQueryOptions = () => ({
  ...getOverviewApiV1AnalyticsOverviewGetOptions(),
  staleTime: 30_000,
});

export const alertTrendsQueryOptions = (days = 30, interval = "1 day") => ({
  ...getAlertTrendsApiV1AnalyticsAlertTrendsGetOptions({
    query: { days, interval },
  }),
  staleTime: 60_000,
});

export const machineHealthQueryOptions = () => ({
  ...getMachineHealthApiV1AnalyticsMachineHealthGetOptions(),
  staleTime: 30_000,
});

export const overviewQueryKey = () => getOverviewApiV1AnalyticsOverviewGetQueryKey();

export const alertTrendsQueryKey = (days?: number, interval?: string) =>
  getAlertTrendsApiV1AnalyticsAlertTrendsGetQueryKey(
    days !== undefined || interval !== undefined
      ? { query: { days: days ?? 30, interval: interval ?? "1 day" } }
      : undefined,
  );

export const machineHealthQueryKey = () => getMachineHealthApiV1AnalyticsMachineHealthGetQueryKey();
