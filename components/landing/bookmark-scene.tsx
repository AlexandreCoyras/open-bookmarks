'use client'

import { Float, RoundedBox } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import type { Group } from 'three'
import { MathUtils } from 'three'

function FadeIn({
	delay,
	children,
}: { delay: number; children: React.ReactNode }) {
	const ref = useRef<Group>(null)
	const progress = useRef(0)
	const started = useRef(false)

	useFrame(({ clock }) => {
		if (!ref.current) return
		if (!started.current) {
			if (clock.getElapsedTime() < delay) return
			started.current = true
		}
		progress.current = MathUtils.lerp(progress.current, 1, 0.05)
		ref.current.scale.setScalar(progress.current)
	})

	return (
		<group ref={ref} scale={0}>
			{children}
		</group>
	)
}

function FloatingBookmarkCard({
	position,
	rotation,
	color = '#f5f0e8',
}: {
	position: [number, number, number]
	rotation: [number, number, number]
	color?: string
}) {
	return (
		<Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
			<group position={position} rotation={rotation}>
				<RoundedBox args={[2.2, 1.4, 0.08]} radius={0.1}>
					<meshPhongMaterial
						color={color}
						transparent
						opacity={0.9}
						shininess={30}
					/>
				</RoundedBox>
				<mesh position={[-0.7, 0.3, 0.05]}>
					<circleGeometry args={[0.15, 16]} />
					<meshPhongMaterial color="#e8a030" />
				</mesh>
				<mesh position={[0.1, 0.3, 0.05]}>
					<planeGeometry args={[1.2, 0.08]} />
					<meshPhongMaterial color="#c8c0b0" />
				</mesh>
				<mesh position={[-0.1, 0.05, 0.05]}>
					<planeGeometry args={[0.8, 0.06]} />
					<meshPhongMaterial color="#d5cfc5" />
				</mesh>
			</group>
		</Float>
	)
}

function FloatingFolder({
	position,
	rotation,
	color,
}: {
	position: [number, number, number]
	rotation: [number, number, number]
	color: string
}) {
	return (
		<Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
			<group position={position} rotation={rotation}>
				<RoundedBox args={[1.6, 1.2, 0.15]} radius={0.12}>
					<meshPhongMaterial color={color} shininess={20} />
				</RoundedBox>
				<mesh position={[-0.35, 0.7, 0]}>
					<boxGeometry args={[0.6, 0.2, 0.15]} />
					<meshPhongMaterial color={color} />
				</mesh>
			</group>
		</Float>
	)
}

function SwayGroup({ children }: { children: React.ReactNode }) {
	const ref = useRef<Group>(null)
	useFrame(({ clock }) => {
		if (!ref.current) return
		const t = clock.getElapsedTime()
		ref.current.rotation.y = Math.sin(t * 0.3) * 0.25
	})
	return <group ref={ref}>{children}</group>
}

export default function BookmarkScene() {
	const [crashed, setCrashed] = useState(false)

	if (crashed) {
		return <div className="min-h-[400px]" />
	}

	return (
		<div className="h-[500px] w-full">
			<Canvas
				dpr={[1, 1.5]}
				camera={{ position: [0, 0, 12], fov: 45 }}
				gl={{ alpha: true, powerPreference: 'low-power', antialias: false }}
				onCreated={({ gl }) => {
					const canvas = gl.domElement
					canvas.addEventListener('webglcontextlost', () => setCrashed(true))
				}}
			>
				<ambientLight intensity={0.6} />
				<directionalLight
					position={[5, 5, 5]}
					intensity={0.7}
					color="#f5c842"
				/>
				<pointLight position={[-3, -2, 4]} intensity={0.3} color="#ffeedd" />

				<SwayGroup>
					<FadeIn delay={0}>
						<FloatingBookmarkCard
							position={[-2, 1.5, 0]}
							rotation={[0.1, 0.2, -0.05]}
						/>
					</FadeIn>
					<FadeIn delay={0.15}>
						<FloatingBookmarkCard
							position={[1.5, 1, 1]}
							rotation={[-0.05, -0.15, 0.1]}
						/>
					</FadeIn>
					<FadeIn delay={0.3}>
						<FloatingBookmarkCard
							position={[-1, -1, 0.5]}
							rotation={[0.05, 0.1, 0.05]}
						/>
					</FadeIn>
					<FadeIn delay={0.45}>
						<FloatingBookmarkCard
							position={[2, -0.5, -0.5]}
							rotation={[-0.1, 0.2, -0.1]}
						/>
					</FadeIn>
					<FadeIn delay={0.6}>
						<FloatingFolder
							position={[-2.5, -1, -1]}
							rotation={[0.1, 0.3, 0.1]}
							color="#e8a030"
						/>
					</FadeIn>
					<FadeIn delay={0.75}>
						<FloatingFolder
							position={[2.5, 1.5, -0.5]}
							rotation={[-0.1, -0.2, -0.05]}
							color="#6b8e5a"
						/>
					</FadeIn>
				</SwayGroup>
			</Canvas>
		</div>
	)
}
