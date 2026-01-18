import React from 'react'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'

export const HomeMessage = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Connections</CardTitle>
                <CardDescription>Recent Messages</CardDescription>
            </CardHeader>
        </Card>
    )
}
