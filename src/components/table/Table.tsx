import styled from "styled-components";

export const Table = styled.table`
  border-collapse: collapse;
  width: 100%;

  th {
    padding-top: 6px;
    padding-bottom: 6px;
    text-align: left;
    background-color: #9050cc;
    color: white;
  }

  td,
  th {
    border: 1px solid #ddd;
    padding: 5px;
  }

  tr {
    text-align: center;
    font-size: 0.9rem;
  }

  tr:nth-child(even) {
    background-color: #f2f2f2;
  }

  tr:hover {
    background-color: #ddd;
  }

  tr.selected {
    background-color: #ddd;
  }

  input {
    background: transparent;
    border: none;
    border-bottom: 1px solid black;
    outline: none;
    font-size: var(--input-font-size);
  }
`;
