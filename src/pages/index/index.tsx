import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Button, ConfigProvider } from '@nutui/nutui-react-taro'
import zhCN from '@nutui/nutui-react-taro/dist/locales/zh-CN'
import Taro from '@tarojs/taro'
import { shakeCoin, performDivination, getYaoSymbol, YaoResult } from '../../utils/divination'
import { getHexagramByLines, Hexagram } from '../../data/hexagrams'
import './index.scss'

function Index() {
  const [yaos, setYaos] = useState<YaoResult[]>([]) // 已经摇出的爻
  const [currentShake, setCurrentShake] = useState(0) // 当前摇的次数（0-5）
  const [isShaking, setIsShaking] = useState(false) // 是否正在摇
  const [showResult, setShowResult] = useState(false) // 是否显示结果
  const [hexagram, setHexagram] = useState<Hexagram | null>(null) // 卦象

  // 摇铜钱
  const handleShake = () => {
    if (isShaking || currentShake >= 6) return

    setIsShaking(true)

    // 震动反馈
    Taro.vibrateShort()

    // 模拟摇铜钱的动画延迟
    setTimeout(() => {
      const yaoResult = shakeCoin()
      const newYaos = [...yaos, yaoResult]
      setYaos(newYaos)
      setCurrentShake(currentShake + 1)
      setIsShaking(false)

      // 如果已经摇了6次，显示结果
      if (currentShake + 1 === 6) {
        const divination = performDivination(newYaos)
        const foundHexagram = getHexagramByLines(divination.mainHexagram)
        setHexagram(foundHexagram)
        
        // 延迟显示结果页面
        setTimeout(() => {
          setShowResult(true)
        }, 500)
      }
    }, 600)
  }

  // 重新开始
  const handleReset = () => {
    setYaos([])
    setCurrentShake(0)
    setIsShaking(false)
    setShowResult(false)
    setHexagram(null)
  }

  // 渲染铜钱
  const renderCoins = (coins: (0 | 1)[]) => {
    return (
      <View className='coins-container'>
        {coins.map((coin, index) => (
          <View
            key={index}
            className={`coin ${coin === 1 ? 'yang' : 'yin'} ${isShaking ? 'shaking' : ''}`}
          >
            {coin === 1 ? '阳' : '阴'}
          </View>
        ))}
      </View>
    )
  }

  // 结果页面
  if (showResult && hexagram) {
    return (
      <ConfigProvider locale={zhCN}>
        <View className='result-page'>
          <View className='result-header'>
            <Text className='result-title'>占卜结果</Text>
          </View>

          <View className='hexagram-container'>
            <View className='hexagram-name'>{hexagram.name}</View>
            <View className='hexagram-number'>第{hexagram.number}卦</View>
            
            <View className='hexagram-lines'>
              {yaos.slice().reverse().map((yao, index) => (
                <View key={index} className='yao-line'>
                  <View className={`yao-symbol ${yao.isYang ? 'yang' : 'yin'} ${yao.isChanging ? 'changing' : ''}`}>
                    {getYaoSymbol(yao.isYang)}
                  </View>
                  {yao.isChanging && (
                    <View className='change-indicator'>●</View>
                  )}
                </View>
              ))}
            </View>

            <View className='hexagram-info'>
              <View className='info-item'>
                <Text className='info-label'>上卦：</Text>
                <Text className='info-value'>{hexagram.upperTrigram}</Text>
              </View>
              <View className='info-item'>
                <Text className='info-label'>下卦：</Text>
                <Text className='info-value'>{hexagram.lowerTrigram}</Text>
              </View>
            </View>
          </View>

          <View className='hexagram-detail'>
            <View className='detail-section'>
              <Text className='section-title'>卦象说明</Text>
              <Text className='section-content'>{hexagram.description}</Text>
            </View>

            <View className='detail-section'>
              <Text className='section-title'>卦辞</Text>
              <Text className='section-content'>{hexagram.judgment}</Text>
            </View>

            <View className='detail-section'>
              <Text className='section-title'>象辞</Text>
              <Text className='section-content'>{hexagram.image}</Text>
            </View>
          </View>

          <View className='result-actions'>
            <Button type='primary' size='large' onClick={handleReset}>
              再占一卦
            </Button>
          </View>
        </View>
      </ConfigProvider>
    )
  }

  // 摇卦页面
  return (
    <ConfigProvider locale={zhCN}>
      <View className='index-page'>
        <View className='header'>
          <Text className='title'>易经占卜</Text>
          <Text className='subtitle'>静心凝神，摇铜钱问天机</Text>
        </View>

        <View className='progress-container'>
          <View className='progress-text'>
            {currentShake === 0 ? '准备开始' : `第 ${currentShake} 爻`}
            <Text className='progress-tip'> / 共6爻</Text>
          </View>
          <View className='progress-bar'>
            <View className='progress-fill' style={{ width: `${(currentShake / 6) * 100}%` }} />
          </View>
        </View>

        {currentShake > 0 && (
          <View className='yaos-display'>
            <View className='yaos-title'>已得爻象（从下往上）</View>
            <View className='yaos-list'>
              {yaos.map((yao, index) => (
                <View key={index} className='yao-item'>
                  <View className='yao-index'>第{index + 1}爻</View>
                  <View className={`yao-symbol ${yao.isYang ? 'yang' : 'yin'}`}>
                    {getYaoSymbol(yao.isYang)}
                  </View>
                  {renderCoins(yao.coins)}
                </View>
              ))}
            </View>
          </View>
        )}

        {currentShake < 6 && (
          <View className='shake-container'>
            <View className='instruction'>
              <Text className='instruction-text'>
                {currentShake === 0 ? '点击下方按钮，摇三枚铜钱' : '继续摇铜钱'}
              </Text>
            </View>

            <Button
              type='primary'
              size='large'
              className='shake-button'
              onClick={handleShake}
              disabled={isShaking}
              loading={isShaking}
            >
              {isShaking ? '摇铜钱中...' : currentShake === 0 ? '开始占卜' : `摇第 ${currentShake + 1} 次`}
            </Button>

            {currentShake > 0 && (
              <Button
                type='default'
                size='normal'
                className='reset-button'
                onClick={handleReset}
              >
                重新开始
              </Button>
            )}
          </View>
        )}

        <View className='tips'>
          <View className='tips-title'>占卜说明</View>
          <View className='tips-content'>
            <Text>• 共需摇铜钱6次，每次摇3枚铜钱</Text>
            <Text>• 三个正面为老阳，三个反面为老阴</Text>
            <Text>• 两个正面为少阳，一个正面为少阴</Text>
            <Text>• 从下往上依次形成六爻，最终得出卦象</Text>
          </View>
        </View>
      </View>
    </ConfigProvider>
  )
}

export default Index
