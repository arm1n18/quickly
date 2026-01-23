import { TestBed } from '@angular/core/testing';

import { Portal } from './portal';

describe('Portal', () => {
  let service: Portal;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Portal);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
