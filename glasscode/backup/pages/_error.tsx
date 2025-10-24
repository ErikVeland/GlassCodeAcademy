interface ErrorProps {
  statusCode?: number;
}

export default function CustomError({ statusCode }: ErrorProps) {
  void statusCode; // Silence unused var warning
  return null;
}