export type GUID = string;

export const generateGUID = (): GUID => {
  // RFC4122 version 4 compliant GUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c, i) {
      const r = Math.random() * 16 | 0;
      if (c === "x") {
        return r.toString(16);
      } else {
        // 'y' position: set bits 6 and 7 to 10
        return ((r & 0x3) | 0x8).toString(16);
      }
    },
  );
};

export const isGUID = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
};
