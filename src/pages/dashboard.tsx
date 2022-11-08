import { useState, useEffect } from 'react'
// import { type NextPage } from "next";
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link';
import styles from '../styles/App.module.css'
// import { Context } from '../server/trpc/context';
import { trpc } from "../utils/trpc";
import Passage from '@passageidentity/passage-node';
import { PassageUser } from '@passageidentity/passage-elements/passage-user';

export const getServerSideProps: GetServerSideProps = async (context) => {
  // getServerSideProps runs server-side only and will never execute on the client browser
  // this allows the safe use of a private Passage API Key
  const appID = process.env.PASSAGE_APP_ID || 'NO APP ID';
  const passage = new Passage({
    appID,
    apiKey: process.env.PASSAGE_API_KEY,
    authStrategy: "HEADER",
  });
  try {
    const authToken = context.req.cookies['psg_auth_token'];
    const req = {
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    };
    const userID = await passage.authenticateRequest(req);
    if (userID) {
      // user is authenticated
      const { email, phone } = await passage.user.get(userID);
      const identifier = email ? email : phone; 
      return { props: {isAuthorized: true, appID: appID, username: identifier} };
    }
  } catch (error) {
    // authentication failed
    return { props: {isAuthorized: false, appID: appID} };
  } 

  return { props: {isAuthorized: false, appID: appID} };
}

function Dashboard({ isAuthorized, appID, username = '' }: InferGetServerSidePropsType<typeof getServerSideProps>) {
// const Dashboard: NextPage = ({authToken:string}) => {

  const [result, setResult] = useState({
    isLoading: true,
    isAuthorized: false,
    username: '',
  });

  const hello = trpc.example.hello.useQuery({ text: "from tRPC" });

  useEffect(()=>{
    require('@passageidentity/passage-elements/passage-profile');
  }, []);

  useEffect(() => {
      let cancelRequest = false;
      new PassageUser().userInfo().then(userInfo=> {
          if( cancelRequest ) {
              return;
          }
          if(userInfo === undefined){
              setResult({
                  isLoading: false,
                  isAuthorized: false,
                  username: "",
              });
              return;
          }
          setResult({
              isLoading: false,
              isAuthorized: true,
              username: userInfo.email ? userInfo.email : userInfo.phone
              ,
          });
      });
      return () => {
          cancelRequest = true;
      };
  }, []);


  const authorizedBody = 
  <>
      You successfully signed in with Passage.
      <br/><br/>
      Your username is: <b>{username}</b>
      <passage-profile app-id={appID}></passage-profile>
      <br/><br/>
      <Link
        className={styles.link}
        href={'/'}
      >
        Go back to the home page
      </Link>
  </>

  const unauthorizedBody = 
  <>
      You have not logged in and cannot view the dashboard.
      <br/><br/>
      <Link
        className={styles.link}
        href={'/'}
      >
        Login to continue.
      </Link>
  </>

  return (
      <div className={styles.dashboard}>
          <div className="flex w-full items-center justify-center pt-6 text-2xl text-blue-500">
            {hello.data ? <p>{hello.data.greeting}</p> : <p>Loading..</p>}
            {hello.data ? <p>{JSON.stringify(hello.data)}</p> : <p>Loading...</p>}
          </div>

          <div className="flex w-full items-center justify-center pt-6 text-2xl text-blue-500">
            {!result.isLoading ? <p>{JSON.stringify(result)}</p> : <p>Loading...</p>}
          </div>

          <div className={styles.title}>{isAuthorized ? 'Welcome!' : 'Unauthorized'}</div>
          <div className={styles.message}>
              { isAuthorized ? authorizedBody : unauthorizedBody }
          </div>
      </div>
  );
}

export default Dashboard;