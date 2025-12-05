import { TestBed } from '@angular/core/testing';

import { Validator } from './validator';

describe('Validator', () => {
  let service: Validator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Validator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
