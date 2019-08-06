import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  CssBaseline,
  Container,
  Typography,
  Button,
  CircularProgress
} from '@material-ui/core';
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

const StyledButton = styled(Button)`
  &&,
  &&:disabled {
    width: 230px;
    height: 40px;
    margin-bottom: 24px;
    color: white;
    border: 1px solid white;
  }
`;

function Content() {
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socket = io();
    setSocket(socket);

    socket.on('transactions', data => {
      setLoading(false);
      console.log({ ...data, lastUpdated: new Date(data.lastUpdated) });
      setTransactions({ ...data, lastUpdated: new Date(data.lastUpdated) });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getTransactions = () => {
    setLoading(true);
    socket.emit('getTransactions');
  };

  if (!transactions) return <Typography>Loading...</Typography>;
  return (
    <>
      <StyledButton
        variant="outlined"
        color="default"
        onClick={getTransactions}
        disabled={loading}
      >
        {loading ? (
          <CircularProgress color="inherit" size={24} />
        ) : (
          'Refresh transactions'
        )}
      </StyledButton>

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
