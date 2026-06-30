import Holidays from "date-holidays";

const hd = new Holidays("PH");

export function getHoliday(date)
{
  const result = hd.isHoliday(date);

  return result
    ? result[0]
    : null;
}

export function isHoliday(date)
{
  return !!getHoliday(date);
}