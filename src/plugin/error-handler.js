const ERROR_MESSAGES = {
  NO_QUERY_EDITOR: {
    title: 'No Query Editor',
    message: 'Please open a query editor tab.'
  },
  NO_QUERY: {
    title: 'No Query',
    message: 'Please write or select a SQL query.'
  },
  ALREADY_EXPLAINED: {
    title: 'Query Already Has EXPLAIN',
    message: 'Please remove the EXPLAIN statement first.'
  },
  INVALID_QUERY: {
    title: 'Invalid Query Type',
    message: 'EXPLAIN only works with SELECT, INSERT, UPDATE, DELETE, or WITH queries.'
  },
  NO_RESULT: {
    title: 'No EXPLAIN Data',
    message: 'The EXPLAIN query returned no data. Make sure you are connected to a PostgreSQL database.'
  },
  NO_COLUMNS: {
    title: 'Error',
    message: 'No columns in result.'
  },
  NO_PLAN_DATA: {
    title: 'Error',
    message: 'Could not extract EXPLAIN data.'
  },
  INVALID_PLAN_STRUCTURE: {
    title: 'Error',
    message: 'Invalid EXPLAIN plan structure.'
  },
  PARSE_ERROR: {
    title: 'Error Parsing Plan',
    message: 'Could not parse EXPLAIN JSON: {message}'
  }
};

export function handleError(errorCode, context, additionalMessage = '') {
  const error = ERROR_MESSAGES[errorCode] || {
    title: 'Unexpected Error',
    message: additionalMessage || 'An unexpected error occurred.'
  };

  const message = error.message.replace('{message}', additionalMessage);
  context.alert(error.title, message);
}
