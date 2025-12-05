import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { BaseChartDirective } from "ng2-charts";

@Component({
  selector: 'app-doughnut-chart',
  imports: [BaseChartDirective],
  templateUrl: './doughnut-chart.html',
  styleUrl: './doughnut-chart.css'
})
export class DoughnutChart implements OnChanges {
  @Input() correct: number = 0;
  @Input() incorrect: number = 0;

  chartType: ChartType = 'doughnut';
  chartConfig: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: {
        datasets: [{
        data: [this.correct, this.incorrect],
        backgroundColor: ['#4765FF', '#A7B2FF'],
        hoverBorderWidth: 0,
        hoverOffset: 0,
        borderWidth: 0,
        offset: 8
      }],
    },
    options: {
      responsive: false,
      cutout: 55,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          enabled: false
        }
      },
      hover: {
        mode: undefined,
      },
      events: [],
      elements: {
        arc: {
          borderRadius: 12,
        }
      }
    }
  }
  ngOnChanges(): void {
    this.chartConfig.data.datasets[0].data = [this.correct, this.incorrect];
  }
}
