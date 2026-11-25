interface DataType {
  name: {
    first: string;
    last: string;
  };
  login: {
    uuid: string;
  };
  picture: {
    medium: string;
  };
}

export interface UserType {
  name: string;
  uuid: string;
  avatar: string;
}

export const userRequestUrl =
  'https://randomuser.me/api/?inc=name,login,picture&noinfo&nat=us';

const fallbackAvatar = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#d9d9d9"/><circle cx="50" cy="38" r="18" fill="#ffffff"/><path d="M15 95c5-22 20-32 35-32s30 10 35 32" fill="#ffffff"/></svg>'
)}`;

const fallbackUser: UserType = {
  name: 'Гость',
  uuid: 'guest',
  avatar: fallbackAvatar,
};

let userPromise: Promise<UserType> | null = null;

export const getUser = (): Promise<UserType> => {
  if (!userPromise) {
    userPromise = fetch(userRequestUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        return response.json() as Promise<{ results: DataType[] }>;
      })
      .then(({ results }) => {
        const user = results[0];

        if (!user) {
          throw new Error('Empty user response');
        }

        const { first, last } = user.name;

        return {
          name: `${first} ${last}`,
          uuid: user.login.uuid,
          avatar: user.picture.medium,
        };
      })
      .catch(() => {
        userPromise = null;

        return { ...fallbackUser };
      });
  }

  return userPromise;
};
