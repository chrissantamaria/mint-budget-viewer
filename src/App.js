import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { CssBaseline, Container, Typography } from '@material-ui/core';
import io from 'socket.io-client';
import { format as formatDate } from 'date-fns';

const Root = styled.div`
  background: #333;
  display: flex;
  align-items: center;
`;

const StyledContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  padding: 24px;
  color: white;
`;

function Content() {
  const [transactions, setTransactions] = useState(null);
  useEffect(() => {
    const socket = io();
    socket.on('transactions', data => {
      console.log({ ...data, lastUpdated: new Date(data.lastUpdated) });
      setTransactions({ ...data, lastUpdated: new Date(data.lastUpdated) });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!transactions) return <Typography>Loading...</Typography>;
  return (
    <>
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        Last updated: {formatDate(transactions.lastUpdated, 'Pp')}
      </Typography>
      {transactions.data.map((transaction, i) => (
        <Typography key={i}>{JSON.stringify(transaction)}</Typography>
      ))}
    </>
  );
}

export default function App() {
  return (
    <>
      <CssBaseline />
      <Root>
        <StyledContainer maxWidth="md">
          <Content />
        </StyledContainer>
      </Root>
    </>
  );
}
