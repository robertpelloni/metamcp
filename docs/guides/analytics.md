# Analytics Dashboard

## Overview

The Analytics Dashboard provides comprehensive insights into the performance and usage of your MetaMCP agents and tools. It allows you to monitor key metrics, track execution trends, and inspect individual tool calls for debugging purposes.

## Features

*   **Real-time Monitoring**: Visualize tool usage, success rates, and error rates.
*   **Historical Data**: View trends over time (daily, weekly, monthly).
*   **Traffic Inspection**: Analyze detailed logs of every tool execution using the MCP Shark inspector.
*   **User Interface**: Accessible via the `/observability` page.

## Usage

### Dashboard Tab

The main dashboard view displays aggregated metrics:

*   **Total Tool Calls**: The cumulative number of tool executions.
*   **Success Rate**: Percentage of successful executions.
*   **Error Rate**: Percentage of failed executions.
*   **Daily Activity**: A bar chart showing tool usage over the last 30 days.
*   **Top Tools**: A ranked list of the most frequently used tools.

### Inspector Tab (MCP Shark)

Switch to the **Traffic Inspector** tab to access the MCP Shark interface.

*   **Detailed Logs**: Browse through individual tool calls with full request and response payloads.
*   **Search & Filter**: Find specific interactions by tool name, status, or content.
*   **Copy & Paste**: Easily copy JSON payloads for debugging or analysis.

## Best Practices

*   **Monitor Errors**: Regularly check the Error Rate to identify problematic tools or configurations.
*   **Optimize Usage**: Identify high-usage tools in the "Top Tools" chart to optimize performance or caching strategies.
*   **Debug with Inspector**: Use the Inspector tab to troubleshoot complex interactions or unexpected behaviors.
