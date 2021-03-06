import { INSTANCE } from "@aerogear/core";
import { SecurityCheck, SecurityCheckResult } from "./deviceTrust";
import { CheckResultMetrics, SecurityCheckResultMetric } from "./metrics";

/**
 * Service module for handling performing and reporting  possible security
 * issues in a mobile application.
 *
 * This requires the @aerogear/cordova-plugin-aerogear-security plugin to be
 * included in an application.
 */
export class SecurityService {
  private static readonly METRICS_KEY = "security";

  /**
   * Execute the provided security check and return the result.
   *
   * @returns The result of the provided check.
   */
  public check(check: SecurityCheck): Promise<SecurityCheckResult> {
    return check.check();
  }

  /**
   * Execute the provided security check and publish the result as a metric.
   *
   * @return The sent metric for the check result.
   */
  public checkAndPublishMetric(check: SecurityCheck): Promise<SecurityCheckResultMetric> {
    return this.check(check)
      .then(checkResult => this.publishCheckResultMetrics(checkResult))
      .then(checkMetrics => checkMetrics[0]);
  }

  /**
   * Execute the provided security checks and return the results in an array.
   *
   * @returns An array of results for the provided checks.
   */
  public checkMany(...checks: SecurityCheck[]): Promise<SecurityCheckResult[]> {
    return Promise.all(checks.map(check => check.check()));
  }

  /**
   * Execute the provided security checks and publish the results as metrics.
   *
   * @return An array of the sent metrics.
   */
  public checkManyAndPublishMetric(...checks: SecurityCheck[]): Promise<SecurityCheckResultMetric[]> {
    return this.checkMany(...checks)
      .then(checkResults => this.publishCheckResultMetrics(...checkResults));
  }

  /**
   * Publish metrics results from self defence checks to a metrics service.
   * Application configuration must be provided to the security service on
   * creation, otherwise metrics sending will always fail.
   *
   * @return Promise with the result of the underlying metrics publisher.
   */
  private publishCheckResultMetrics(...results: SecurityCheckResult[]): Promise<SecurityCheckResultMetric[]>  {
    if (!results || results.length === 0) {
      return Promise.resolve([]);
    }

    const checkResultMetrics = new CheckResultMetrics(results);
    if (!INSTANCE || !INSTANCE.metrics) {
      return Promise.reject(new Error("Metrics configuration is not available."));
    }

    return INSTANCE.metrics.publish(SecurityService.METRICS_KEY, [checkResultMetrics])
      .then(() => checkResultMetrics.collect());
  }
}
