declare let Swal: {
  fire: (obj: any, func?: (text: string) => boolean) => Promise<{ isConfirmed: boolean; value: any }>;
  getHtmlContainer: () => HTMLDivElement;
  update: (obj: any) => void;
  showLoading: () => void;
  getTimerLeft: () => string;
  // fire: (obj: any) => Promise<{ isConfirmed: boolean }>;
}
