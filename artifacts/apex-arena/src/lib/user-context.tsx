import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { useUpsertUser } from "@workspace/api-client-react";

interface UserContextType {
  userId: string;
  username: string;
  setUsername: (username: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<string>("");
  const [username, setUsernameState] = useState<string>("");
  
  const upsertUser = useUpsertUser();

  useEffect(() => {
    let storedUserId: string = localStorage.getItem("apex_arena_user_id") ?? "";
    let storedUsername: string = localStorage.getItem("apex_arena_username") ?? "";

    if (!storedUserId) {
      storedUserId = uuidv4();
      localStorage.setItem("apex_arena_user_id", storedUserId);
    }

    if (!storedUsername) {
      const shortId = storedUserId.substring(0, 6);
      storedUsername = `apex_dev_${shortId}`;
      localStorage.setItem("apex_arena_username", storedUsername);
    }

    setUserIdState(storedUserId);
    setUsernameState(storedUsername);

    // Register user
    upsertUser.mutate({
      data: {
        id: storedUserId,
        username: storedUsername,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setUsername = (newUsername: string) => {
    if (!userId) return;
    setUsernameState(newUsername);
    localStorage.setItem("apex_arena_username", newUsername);
    upsertUser.mutate({
      data: {
        id: userId,
        username: newUsername
      }
    });
  };

  if (!userId) {
    return null; // or loading
  }

  return (
    <UserContext.Provider value={{ userId, username, setUsername }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
