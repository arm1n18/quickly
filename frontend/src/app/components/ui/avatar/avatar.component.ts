import { NgStyle, NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  imports: [NgStyle, NgClass],
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
})

export class AvatarComponent {
  private colors = [
    "red",
    "orange",
    "pink",
    "blue",
    "green",
    "purple"
  ];
  
  @Input() avatarUrl?: string;
  @Input({required: true}) name: string = '';
  @Input() size: 'md' | 'sm' = 'md';

  get initials(): string {
    return this.name.trim().charAt(0).toUpperCase();
  }

  get avatarStyle() {
    return this.avatarUrl
      ? { 'background-image': `url(${this.avatarUrl})` }
      : null
  }

  get avatarColorClass(): string | null {
    if(!this.avatarUrl) {
      let hash = 0;
      for (let i = 0; i < this.name.length; i++) {
          hash = (hash << 5) - hash + this.name.charCodeAt(i);
      }
      return this.colors[Math.abs(hash) % this.colors.length];
    }
    return null
  };
}
