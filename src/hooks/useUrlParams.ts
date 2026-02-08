import { useSearchParams } from "react-router-dom";

export const useUrlParams = () => {
  const [searchParams] = useSearchParams();
  const roomID = searchParams.get('roomID');
  const userID = searchParams.get('userID');
  return { roomID, userID };
}