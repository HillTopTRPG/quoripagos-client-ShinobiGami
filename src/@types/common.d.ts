declare let Swal: {
  fire: (obj: any, func?: (text: string) => boolean) => Promise<{ isConfirmed: boolean; value: any }>;
  // fire: (obj: any) => Promise<{ isConfirmed: boolean }>;
}
