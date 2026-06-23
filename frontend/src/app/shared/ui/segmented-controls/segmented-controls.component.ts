import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface Segment {
  title: string;
  onClick?: () => void;
}

@Component({
  selector: 'app-segmented-controls',
  imports: [NgClass],
  templateUrl: './segmented-controls.component.html',
  styleUrl: './segmented-controls.component.css',
})

export class SegmentedControlsComponent {
  @Input({required: true}) segments: Segment[] = [];
  @Input() selected: number = 0;
  @Output() selectedSegment = new EventEmitter<number>();

  public selectSegment(id: number) {
    this.selected = id;
    this.segments[id].onClick
    this.selectedSegment.emit(id)
  }
}
