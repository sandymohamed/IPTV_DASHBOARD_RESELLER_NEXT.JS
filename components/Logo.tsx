'use client';

import NextLink from 'next/link';
import { Box, Typography } from '@mui/material';

interface LogoProps {
  sx?: object;
}

export default function Logo({ sx }: LogoProps) {
  return (
    <NextLink href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          overflow: 'hidden',

          ...sx,
        }}
      >
        <Box
          component="img"
          //TODO: Replace with actual logo
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAMAAABC4vDmAAAAY1BMVEUkeMD///8Qcr6MrdYAa7sYdL4Abby80eh7ptT3+v1mm8+3zeagwOAHcL2KsNkfdr88gsQAaLrs8/kwfcJfls3R3++UtttJicfg6vXa5fKqxeIAY7iFqtWTsdhXkMrG1upyn9A25I2KAAADYUlEQVR4nO2XXbuqIBBGjSOWmuFnltuj/f9feTQZxAqRTt3s511XhTizZADR8wAAAAAAAAAAAAAAAAAAAAAAAADwSxFMh49NfNnExdx7eenhVsHVT0OOrU713z8a3RCPRXpLe4jqxJdpeLfovaBNi1aL8irHodgmxQ87nWPief5+0bQL80vc8Xue5LwzEkbeVf6sskUOFbAXLx3ekZryRL5NqvSP9HOZPAtl+21j/bZK7cITs0mxlH4f9OyspObgwyM1cAosUjyj+sWJliJpqNXf5vQo1axI5TW3SKnLl3QeE1GQavS4Kk2ILm4qedO1iceqz/OyaZr9dU4bM4uU6Gj2lHN+To2XjWtvtOL+SUY6Zvc1pqTKgLMhETnv8kIUqcSjTu3cNAhQ32OgEjAK3yRGiWeS0zKSkorG6SpYogZrGAsqSxDLtgOlEnqoyzx91ETrtlZvXWqKwm8kdZqfdZbSF5pIqGutDASN83Lz+k8pUVyei/JaysuofufkKbpL9axSHiOp2CrFWtncU6F5PzWETtWzj5SSauaZYpASdS6LRZtCKm++io0750apNN86p4Zg+2U7j57v/YQUUxNd2/1MUow2436a1wFt54XTQNmkuKDq5Vpgk5SXyfbwXi4RyFGunNbeilSZBYH/M2+esZbfKBXQ3fcjAe+oelsPeDapPo7jnubTOHe19WOUUsW+P0IiTzN57VY9s9QD50C7ySg1L7dhjxdCDnMVeG5slDovlo9ZSl0ZNiZR67X8vNSZLQpgllJnuuEp1F7qtHFularqh23GLOX5chpeMs+X1du7Vs8ulTeleHzUFSk6aYbDSzk0dXpb6ti27eHWiZ+AP62dFSkeSZWzL6vncLyzSpX+qy9Lq5Tw5Prracxi5+rZTwmOUurVktPu4HZA+I4UVxuBlHN7F39HyqMDtOxzdJ7mwzvz41JMfvRMEz4sXavHy6qnU8Clr1r2CSn1VTWFfV67NqmVL+S3pbzgqsd0XnvfkVp8tDoe774mJdI5ZOW+9lalVlbNutT8qTy+yd+RCmfuUkO+6c9tfaSmW15LsROFzGv3nVOkt0hjPCDyTv5J1+6rqdPLGSMKilg6z6gRriP0ltVwQnayXDZ2AAAAAAAAAAAAAAAAAAAAAAAAAMDv4h8WdDNSLnWmbQAAAABJRU5ErkJggg=="
          alt="Logo"
          onError={(e: any) => {
            e.target.style.display = 'none';
          }}
          sx={{
            width: 40,
            height: 40,
            overflow: 'hidden',
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          IPTV Dashboard
        </Typography>
      </Box>
    </NextLink>
  );
}
