export interface LicensePlateResponse {
  status: string;
  data: {
    intro: {
      vin: string;
      license: string;
      state: string;
    };
    basic: {
      make: string;
      model: string;
      year: number;
    };
  };
}
