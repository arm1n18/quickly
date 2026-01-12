import { TestBed } from '@angular/core/testing';

import { CardsState } from './cards-state';

describe('CardsState', () => {
  let service: CardsState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CardsState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
