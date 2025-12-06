import { Component, Input, OnChanges } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
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
        },
      }
    },
    plugins: [
      {
      id: 'centerText',
      afterDraw: (chart) => {
        const { ctx } = chart;

        const centerX = chart.getDatasetMeta(0).data[0].x+2;
        const centerY = chart.getDatasetMeta(0).data[0].y+2;

        const text = `${Math.round(((this.correct * 100) / (this.incorrect+this.correct)))}%`;
        ctx.save();

        ctx.font = '500 32px "Roboto"';
        // ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4765FF';
        ctx.fillText(text, centerX, centerY);
        ctx.restore();
      }
    }
    ]
  }
  
  ngOnChanges(): void {
    this.chartConfig.data.datasets[0].data = [this.correct, this.incorrect];
  }
}
